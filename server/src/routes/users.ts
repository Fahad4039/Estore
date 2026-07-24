import { Router, type IRouter } from 'express';
import { query, queryOne, execute } from '../db/postgres';
import { createHash } from 'crypto';
import bcrypt from 'bcrypt';

const router: IRouter = Router();

function hashPassword(pw: string) {
  return createHash('sha256').update(pw + 'estore-salt-2025').digest('hex');
}

const BCRYPT_SALT_ROUNDS = 12;

async function getSessionUser(sid: string | undefined): Promise<any | null> {
  if (!sid) return null;
  return queryOne<any>(
    `SELECT u.id,u.name,u.email,u.role,u.is_seller,u.coins,u.wallet_balance,
            u.membership,u.avatar,u.bio,u.phone,u.referral_code
     FROM sessions s JOIN users u ON s.user_id=u.id WHERE s.id=$1 AND s.expires_at > NOW()`, [sid]
  );
}

// GET /api/users/profile
router.get('/users/profile', async (req, res) => {
  const user = await getSessionUser(req.cookies?.sid);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  res.json(user);
});

// PUT /api/users/profile
router.put('/users/profile', async (req, res) => {
  const user = await getSessionUser(req.cookies?.sid);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  const { name, avatar, bio, phone } = req.body ?? {};
  try {
    const setClauses: string[] = [];
    const vals: any[] = [];
    let n = 1;
    if (name !== undefined)   { setClauses.push(`name=$${n++}`);   vals.push(name); }
    if (avatar !== undefined) { setClauses.push(`avatar=$${n++}`); vals.push(avatar); }
    if (bio !== undefined)    { setClauses.push(`bio=$${n++}`);    vals.push(bio); }
    if (phone !== undefined)  { setClauses.push(`phone=$${n++}`);  vals.push(phone); }
    if (!setClauses.length) return res.status(400).json({ error: 'No fields to update' });
    vals.push(user.id);
    await execute(`UPDATE users SET ${setClauses.join(',')} WHERE id=$${n}`, vals);
    const updated = await queryOne<any>(
      'SELECT id,name,email,role,is_seller,coins,wallet_balance,membership,avatar,bio,phone,referral_code FROM users WHERE id=$1',
      [user.id]
    );
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/password
router.put('/users/password', async (req, res) => {
  const user = await getSessionUser(req.cookies?.sid);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  const { currentPassword, newPassword } = req.body ?? {};
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'currentPassword and newPassword required' });
  try {
    const dbUser = await queryOne<any>('SELECT password_hash FROM users WHERE id=$1', [user.id]);
    const currentPasswordMatches = dbUser?.password_hash?.startsWith('$2')
      ? await bcrypt.compare(currentPassword, dbUser.password_hash)
      : dbUser?.password_hash === hashPassword(currentPassword);
    if (!currentPasswordMatches) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    await execute('UPDATE users SET password_hash=$1 WHERE id=$2', [
      await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS),
      user.id,
    ]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/notifications
router.get('/users/notifications', async (req, res) => {
  const user = await getSessionUser(req.cookies?.sid);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const notifications = await query<any>(
      'SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 30', [user.id]
    );
    const unread = notifications.filter((n: any) => !n.is_read).length;
    res.json({ notifications, unread });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/notifications/read
router.put('/users/notifications/read', async (req, res) => {
  const user = await getSessionUser(req.cookies?.sid);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  try {
    await execute('UPDATE notifications SET is_read=true WHERE user_id=$1', [user.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
