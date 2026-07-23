import { Router } from 'express';
import { query, queryOne, execute } from '../db/postgres';
import { randomBytes } from 'crypto';

const router = Router();
function makeId() { return randomBytes(8).toString('hex'); }

async function getSessionUser(sid: string | undefined): Promise<any | null> {
  if (!sid) return null;
  return queryOne<any>(
    `SELECT u.id,u.name,u.coins,u.wallet_balance,u.membership,u.referral_code
     FROM sessions s JOIN users u ON s.user_id=u.id WHERE s.id=$1 AND s.expires_at > NOW()`, [sid]
  );
}

// GET /api/wallet
router.get('/wallet', async (req, res) => {
  const user = await getSessionUser(req.cookies?.sid);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const transactions = await query<any>(
      'SELECT * FROM wallet_transactions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50', [user.id]
    );
    res.json({
      balance: Number(user.wallet_balance), coins: user.coins,
      membership: user.membership, referralCode: user.referral_code, transactions,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/wallet/topup
router.post('/wallet/topup', async (req, res) => {
  const user = await getSessionUser(req.cookies?.sid);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  const { amount, method = 'card' } = req.body ?? {};
  if (!amount || amount <= 0) return res.status(400).json({ error: 'amount required' });
  try {
    await execute('UPDATE users SET wallet_balance=wallet_balance+$1 WHERE id=$2', [amount, user.id]);
    await execute(
      'INSERT INTO wallet_transactions (id,user_id,type,amount,description,status) VALUES ($1,$2,$3,$4,$5,$6)',
      [makeId(), user.id, 'topup', amount, `Top-up via ${method}`, 'completed']
    );
    const updated = await queryOne<any>('SELECT wallet_balance,coins FROM users WHERE id=$1', [user.id]);
    res.json({ success: true, balance: Number(updated?.wallet_balance), coins: updated?.coins });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/wallet/cashout
router.post('/wallet/cashout', async (req, res) => {
  const user = await getSessionUser(req.cookies?.sid);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  const { amount, method = 'bank' } = req.body ?? {};
  if (!amount || amount <= 0) return res.status(400).json({ error: 'amount required' });
  if (Number(user.wallet_balance) < amount) return res.status(400).json({ error: 'Insufficient balance' });
  try {
    await execute('UPDATE users SET wallet_balance=wallet_balance-$1 WHERE id=$2', [amount, user.id]);
    await execute(
      'INSERT INTO wallet_transactions (id,user_id,type,amount,description,status) VALUES ($1,$2,$3,$4,$5,$6)',
      [makeId(), user.id, 'cashout', -amount, `Cash-out via ${method}`, 'completed']
    );
    const updated = await queryOne<any>('SELECT wallet_balance FROM users WHERE id=$1', [user.id]);
    res.json({ success: true, balance: Number(updated?.wallet_balance) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/wallet/coins/redeem
router.post('/wallet/coins/redeem', async (req, res) => {
  const user = await getSessionUser(req.cookies?.sid);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  const { coins } = req.body ?? {};
  if (!coins || coins < 100) return res.status(400).json({ error: 'Minimum 100 coins to redeem' });
  if (user.coins < coins) return res.status(400).json({ error: 'Insufficient coins' });
  const amount = coins / 100;
  try {
    await execute('UPDATE users SET coins=coins-$1, wallet_balance=wallet_balance+$2 WHERE id=$3', [coins, amount, user.id]);
    await execute(
      'INSERT INTO wallet_transactions (id,user_id,type,amount,coins,description) VALUES ($1,$2,$3,$4,$5,$6)',
      [makeId(), user.id, 'spend', amount, -coins, `Redeemed ${coins} coins for $${amount}`]
    );
    const updated = await queryOne<any>('SELECT wallet_balance,coins FROM users WHERE id=$1', [user.id]);
    res.json({ success: true, balance: Number(updated?.wallet_balance), coins: updated?.coins });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/checkin
router.get('/checkin', async (req, res) => {
  const user = await getSessionUser(req.cookies?.sid);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const today = new Date().toISOString().slice(0, 10);
    const todayCheckIn = await queryOne('SELECT id FROM check_ins WHERE user_id=$1 AND check_date=$2', [user.id, today]);
    const streak = await queryOne<any>('SELECT MAX(streak) as max_streak FROM check_ins WHERE user_id=$1', [user.id]);
    const total = await queryOne<any>('SELECT COUNT(*) as cnt FROM check_ins WHERE user_id=$1', [user.id]);
    res.json({
      checkedInToday: !!todayCheckIn, streak: streak?.max_streak || 0,
      totalCheckIns: Number(total?.cnt) || 0, coins: user.coins,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/checkin
router.post('/checkin', async (req, res) => {
  const user = await getSessionUser(req.cookies?.sid);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  const today = new Date().toISOString().slice(0, 10);
  try {
    const existing = await queryOne('SELECT id FROM check_ins WHERE user_id=$1 AND check_date=$2', [user.id, today]);
    if (existing) return res.status(409).json({ error: 'Already checked in today' });
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const yday = await queryOne<any>('SELECT streak FROM check_ins WHERE user_id=$1 AND check_date=$2', [user.id, yesterday]);
    const streak = yday ? (yday.streak + 1) : 1;
    const coinsEarned = 10 + (streak - 1) * 2;
    await execute('INSERT INTO check_ins (user_id,check_date,coins_earned,streak) VALUES ($1,$2,$3,$4)',
      [user.id, today, coinsEarned, streak]);
    await execute('UPDATE users SET coins=coins+$1 WHERE id=$2', [coinsEarned, user.id]);
    await execute(
      'INSERT INTO wallet_transactions (id,user_id,type,coins,description) VALUES ($1,$2,$3,$4,$5)',
      [makeId(), user.id, 'earn', coinsEarned, `Daily check-in (day ${streak})`]
    );
    const updated = await queryOne<any>('SELECT coins FROM users WHERE id=$1', [user.id]);
    res.json({ success: true, coinsEarned, streak, coins: updated?.coins });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/referral
router.get('/referral', async (req, res) => {
  const user = await getSessionUser(req.cookies?.sid);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const referrals = await query<any>(
      `SELECT r.*,u.name as referee_name,u.created_at as joined_at
       FROM referrals r JOIN users u ON r.referee_id=u.id
       WHERE r.referrer_id=$1 ORDER BY r.created_at DESC`, [user.id]
    );
    const totalBonus = referrals.reduce((s: number, r: any) => s + r.bonus_coins, 0);
    res.json({
      referralCode: user.referral_code, referrals,
      totalReferrals: referrals.length, totalBonus, coins: user.coins,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
