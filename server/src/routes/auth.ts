import { Router } from 'express';
import { query, queryOne, execute } from '../db/postgres';
import { createHash, randomBytes } from 'crypto';

const router = Router();

function hashPassword(pw: string) {
  return createHash('sha256').update(pw + 'estore-salt-2025').digest('hex');
}
function makeId(len = 16) { return randomBytes(len).toString('hex'); }
function makeReferralCode(name: string) {
  return (name.toUpperCase().replace(/\s/g, '').slice(0, 4) + Math.random().toString(36).slice(2, 6).toUpperCase()).slice(0, 8);
}

// POST /api/auth/register
router.post('/auth/register', async (req, res) => {
  const { name, email, password, referralCode } = req.body ?? {};
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password required' });
  try {
    const existing = await queryOne('SELECT id FROM users WHERE email=$1', [email]);
    if (existing) return res.status(409).json({ error: 'Email already registered' });
    const id = makeId();
    const refCode = makeReferralCode(name);
    await execute(
      'INSERT INTO users (id,name,email,password_hash,referral_code,coins) VALUES ($1,$2,$3,$4,$5,$6)',
      [id, name, email, hashPassword(password), refCode, 10]
    );
    if (referralCode) {
      const referrer = await queryOne<any>('SELECT id FROM users WHERE referral_code=$1', [referralCode]);
      if (referrer) {
        await execute('INSERT INTO referrals (referrer_id,referee_id,bonus_coins) VALUES ($1,$2,$3)', [referrer.id, id, 50]);
        await execute('UPDATE users SET coins=coins+50 WHERE id=$1', [referrer.id]);
        await execute('UPDATE users SET coins=coins+20 WHERE id=$1', [id]);
        await execute(
          'INSERT INTO wallet_transactions (id,user_id,type,coins,description,reference) VALUES ($1,$2,$3,$4,$5,$6)',
          [makeId(), referrer.id, 'bonus', 50, 'Referral bonus', id]
        );
      }
    }
    const sessionId = makeId(32);
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await execute('INSERT INTO sessions (id,user_id,expires_at) VALUES ($1,$2,$3)', [sessionId, id, expires]);
    res.cookie('sid', sessionId, { httpOnly: true, sameSite: 'lax', expires });
    const user = await queryOne<any>(
      'SELECT id,name,email,role,is_seller,coins,wallet_balance,membership,referral_code FROM users WHERE id=$1', [id]
    );
    res.status(201).json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    const user = await queryOne<any>(
      'SELECT id,name,email,role,is_seller,coins,wallet_balance,membership,referral_code FROM users WHERE email=$1 AND password_hash=$2',
      [email, hashPassword(password)]
    );
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const sessionId = makeId(32);
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await execute('INSERT INTO sessions (id,user_id,expires_at) VALUES ($1,$2,$3)', [sessionId, user.id, expires]);
    res.cookie('sid', sessionId, { httpOnly: true, sameSite: 'lax', expires });
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/auth/me', async (req, res) => {
  const sid = req.cookies?.sid;
  if (!sid) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const row = await queryOne<any>(
      `SELECT u.id,u.name,u.email,u.role,u.is_seller,u.coins,u.wallet_balance,
              u.membership,u.referral_code,u.avatar,u.bio,u.phone
       FROM sessions s JOIN users u ON s.user_id=u.id
       WHERE s.id=$1 AND s.expires_at > NOW()`, [sid]
    );
    if (!row) return res.status(401).json({ error: 'Session expired' });
    res.json(row);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/logout
router.post('/auth/logout', async (req, res) => {
  const sid = req.cookies?.sid;
  if (sid) { try { await execute('DELETE FROM sessions WHERE id=$1', [sid]); } catch {} }
  res.clearCookie('sid');
  res.json({ success: true });
});

export default router;
