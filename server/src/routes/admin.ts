import { Router } from 'express';
import { query, queryOne, execute } from '../db/postgres';

const router = Router();

async function getSessionUser(sid: string | undefined): Promise<any | null> {
  if (!sid) return null;
  return queryOne<any>(
    `SELECT u.id,u.role FROM sessions s JOIN users u ON s.user_id=u.id
     WHERE s.id=$1 AND s.expires_at > NOW()`, [sid]
  );
}

async function requireAdmin(req: any, res: any): Promise<boolean> {
  const user = await getSessionUser(req.cookies?.sid);
  if (!user || user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return false;
  }
  return true;
}

// GET /api/admin/stats
router.get('/admin/stats', async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  try {
    const [users, sellers, products, orders, revenue, pending, recentOrders] = await Promise.all([
      queryOne<any>('SELECT COUNT(*) as cnt FROM users'),
      queryOne<any>('SELECT COUNT(*) as cnt FROM users WHERE is_seller=true'),
      queryOne<any>('SELECT COUNT(*) as cnt FROM products'),
      queryOne<any>('SELECT COUNT(*) as cnt FROM orders'),
      queryOne<any>("SELECT COALESCE(SUM(total),0) as total FROM orders WHERE status != 'cancelled'"),
      queryOne<any>("SELECT COUNT(*) as cnt FROM orders WHERE status='pending'"),
      query<any>(`SELECT o.id,o.status,o.total,o.created_at,u.name as customer_name
                  FROM orders o JOIN users u ON o.user_id=u.id ORDER BY o.created_at DESC LIMIT 10`),
    ]);
    res.json({
      users: Number(users?.cnt), sellers: Number(sellers?.cnt), products: Number(products?.cnt),
      orders: Number(orders?.cnt), revenue: Number(revenue?.total), pending: Number(pending?.cnt),
      recentOrders,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users
router.get('/admin/users', async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  try {
    const { search, role, page = 1, limit = 20 } = req.query;
    const conditions: string[] = [];
    const params: any[] = [];
    let n = 1;
    if (search) { conditions.push(`(name ILIKE $${n} OR email ILIKE $${n+1})`); params.push(`%${search}%`, `%${search}%`); n += 2; }
    if (role)   { conditions.push(`role=$${n++}`); params.push(role); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(Number(limit), (Number(page) - 1) * Number(limit));
    const users = await query(
      `SELECT id,name,email,role,is_seller,coins,wallet_balance,membership,created_at
       FROM users ${where} ORDER BY created_at DESC LIMIT $${n} OFFSET $${n+1}`, params
    );
    const total = await queryOne<any>('SELECT COUNT(*) as cnt FROM users');
    res.json({ users, total: Number(total?.cnt), page: Number(page), limit: Number(limit) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users/:id
router.get('/admin/users/:id', async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  try {
    const user = await queryOne<any>('SELECT id,name,email,role,is_seller,coins,wallet_balance,membership,created_at FROM users WHERE id=$1', [req.params.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const orders = await query<any>('SELECT id,status,total,created_at FROM orders WHERE user_id=$1 LIMIT 10', [req.params.id]);
    res.json({ user, orders });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/users/:id
router.put('/admin/users/:id', async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  const { name, role, is_seller, coins, wallet_balance, membership } = req.body ?? {};
  try {
    const setClauses: string[] = [];
    const vals: any[] = [];
    let n = 1;
    if (name !== undefined)           { setClauses.push(`name=$${n++}`);           vals.push(name); }
    if (role !== undefined)           { setClauses.push(`role=$${n++}`);           vals.push(role); }
    if (is_seller !== undefined)      { setClauses.push(`is_seller=$${n++}`);      vals.push(!!is_seller); }
    if (coins !== undefined)          { setClauses.push(`coins=$${n++}`);          vals.push(coins); }
    if (wallet_balance !== undefined) { setClauses.push(`wallet_balance=$${n++}`); vals.push(wallet_balance); }
    if (membership !== undefined)     { setClauses.push(`membership=$${n++}`);     vals.push(membership); }
    if (!setClauses.length) return res.status(400).json({ error: 'No fields to update' });
    vals.push(req.params.id);
    await execute(`UPDATE users SET ${setClauses.join(',')} WHERE id=$${n}`, vals);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/users/:id
router.delete('/admin/users/:id', async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  try {
    await execute("DELETE FROM users WHERE id=$1 AND role != 'admin'", [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/orders
router.get('/admin/orders', async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const params: any[] = [];
    let n = 1;
    const where = status ? `WHERE o.status=$${n++}` : '';
    if (status) params.push(status);
    params.push(Number(limit), (Number(page) - 1) * Number(limit));
    const orders = await query<any>(
      `SELECT o.*,u.name as customer_name,u.email as customer_email
       FROM orders o JOIN users u ON o.user_id=u.id ${where}
       ORDER BY o.created_at DESC LIMIT $${n} OFFSET $${n+1}`, params
    );
    const result = await Promise.all(orders.map(async (o: any) => {
      const items = await query<any>('SELECT * FROM order_items WHERE order_id=$1', [o.id]);
      return { ...o, total: Number(o.total), items };
    }));
    const total = await queryOne<any>('SELECT COUNT(*) as cnt FROM orders');
    res.json({ orders: result, total: Number(total?.cnt), page: Number(page), limit: Number(limit) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/products
router.get('/admin/products', async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const params: any[] = [];
    let n = 1;
    const where = status ? `WHERE status=$${n++}` : '';
    if (status) params.push(status);
    params.push(Number(limit), (Number(page) - 1) * Number(limit));
    const products = await query(`SELECT * FROM products ${where} ORDER BY created_at DESC LIMIT $${n} OFFSET $${n+1}`, params);
    const total = await queryOne<any>('SELECT COUNT(*) as cnt FROM products');
    res.json({ products, total: Number(total?.cnt) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
