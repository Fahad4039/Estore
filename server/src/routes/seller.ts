import { Router, type IRouter } from 'express';
import { query, queryOne, execute } from '../db/postgres';
import { randomBytes } from 'crypto';
import { type AuthUser } from '../middlewares/auth';

const router: IRouter = Router();
function makeId() { return randomBytes(8).toString('hex'); }

async function getSessionUser(sid: string | undefined): Promise<any | null> {
  if (!sid) return null;
  return queryOne<any>(
    `SELECT u.id,u.name,u.email,u.role,u.is_seller,u.coins,u.wallet_balance
     FROM sessions s JOIN users u ON s.user_id=u.id WHERE s.id=$1 AND s.expires_at > NOW()`, [sid]
  );
}

// POST /api/seller/register
router.post('/seller/register', async (req, res) => {
  const user = await getSessionUser(req.cookies?.sid);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  try {
    await execute('UPDATE users SET is_seller=true WHERE id=$1', [user.id]);
    res.json({ success: true, message: 'You are now a seller!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/seller/stats
router.get('/seller/stats', async (req, res) => {
  const user = req.user as AuthUser;
  try {
    const [products, orders, pending, recentOrders] = await Promise.all([
      queryOne<any>('SELECT COUNT(*) as cnt FROM products WHERE seller_id=$1', [user.id]),
      queryOne<any>(
        `SELECT COUNT(DISTINCT o.id) as cnt, COALESCE(SUM(oi.price*oi.quantity),0) as revenue
         FROM order_items oi JOIN orders o ON oi.order_id=o.id
         WHERE oi.product_id IN (SELECT id FROM products WHERE seller_id=$1) AND o.status != 'cancelled'`, [user.id]
      ),
      queryOne<any>(
        `SELECT COUNT(DISTINCT o.id) as cnt FROM order_items oi JOIN orders o ON oi.order_id=o.id
         WHERE oi.product_id IN (SELECT id FROM products WHERE seller_id=$1) AND o.status='pending'`, [user.id]
      ),
      query<any>(
        `SELECT o.id,o.status,o.total,o.created_at,u.name as customer_name,oi.name as product_name,oi.quantity,oi.price
         FROM order_items oi JOIN orders o ON oi.order_id=o.id JOIN users u ON o.user_id=u.id
         WHERE oi.product_id IN (SELECT id FROM products WHERE seller_id=$1)
         ORDER BY o.created_at DESC LIMIT 10`, [user.id]
      ),
    ]);
    res.json({
      totalProducts: Number(products?.cnt), totalOrders: Number(orders?.cnt),
      revenue: Number(orders?.revenue), pendingOrders: Number(pending?.cnt),
      recentOrders, coins: user.coins, walletBalance: Number(user.wallet_balance),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/seller/products
router.get('/seller/products', async (req, res) => {
  const user = req.user as AuthUser;
  try {
    const products = await query<any>('SELECT * FROM products WHERE seller_id=$1 ORDER BY created_at DESC', [user.id]);
    res.json({ products });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/seller/orders
router.get('/seller/orders', async (req, res) => {
  const user = req.user as AuthUser;
  try {
    const orders = await query<any>(
      `SELECT DISTINCT o.id,o.status,o.total,o.created_at,
              u.name as customer_name,u.email as customer_email,
              o.shipping_name,o.shipping_address,o.shipping_city,o.shipping_phone
       FROM order_items oi JOIN orders o ON oi.order_id=o.id JOIN users u ON o.user_id=u.id
       WHERE oi.product_id IN (SELECT id FROM products WHERE seller_id=$1)
       ORDER BY o.created_at DESC`, [user.id]
    );
    const result = await Promise.all(orders.map(async (o: any) => {
      const items = await query<any>(
        `SELECT oi.* FROM order_items oi WHERE oi.order_id=$1
         AND oi.product_id IN (SELECT id FROM products WHERE seller_id=$2)`, [o.id, user.id]
      );
      return { ...o, total: Number(o.total), items };
    }));
    res.json({ orders: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/seller/record-sale
router.post('/seller/record-sale', async (req, res) => {
  const user = req.user as AuthUser;
  const { amount, description } = req.body ?? {};
  if (!amount || amount <= 0) return res.status(400).json({ error: 'amount required' });
  try {
    const coinsEarned = Math.floor(amount);
    await execute('UPDATE users SET coins=coins+$1 WHERE id=$2', [coinsEarned, user.id]);
    await execute(
      'INSERT INTO wallet_transactions (id,user_id,type,amount,coins,description) VALUES ($1,$2,$3,$4,$5,$6)',
      [makeId(), user.id, 'earn', amount, coinsEarned, description || `Offline sale of $${amount}`]
    );
    const updated = await queryOne<any>('SELECT coins,wallet_balance FROM users WHERE id=$1', [user.id]);
    res.json({ success: true, coinsEarned, coins: updated?.coins });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/seller/profile/:id
router.get('/seller/profile/:id', async (req, res) => {
  try {
    const seller = await queryOne<any>(
      'SELECT id,name,avatar,bio,created_at FROM users WHERE id=$1 AND is_seller=true', [req.params.id]
    );
    if (!seller) return res.status(404).json({ error: 'Seller not found' });
    const [products, stats] = await Promise.all([
      query<any>("SELECT * FROM products WHERE seller_id=$1 AND status='active' ORDER BY created_at DESC LIMIT 20", [req.params.id]),
      queryOne<any>(
        `SELECT COUNT(DISTINCT o.id) as total_sales,
                AVG(r.rating)::numeric(3,2) as avg_rating,
                COUNT(r.id) as review_count
         FROM products p
         LEFT JOIN order_items oi ON oi.product_id=p.id
         LEFT JOIN orders o ON oi.order_id=o.id
         LEFT JOIN reviews r ON r.product_id=p.id
         WHERE p.seller_id=$1`, [req.params.id]
      ),
    ]);
    res.json({ seller, products, stats });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
