import { Router, type IRouter } from 'express';
import { query, queryOne, execute } from '../db/postgres';
import { randomBytes } from 'crypto';

const router: IRouter = Router();
function makeId() { return randomBytes(12).toString('hex'); }

async function getSessionUser(sid: string | undefined): Promise<any | null> {
  if (!sid) return null;
  return queryOne<any>(
    `SELECT u.id,u.name,u.email,u.role,u.is_seller FROM sessions s
     JOIN users u ON s.user_id=u.id WHERE s.id=$1 AND s.expires_at > NOW()`, [sid]
  );
}

// GET /api/orders
router.get('/orders', async (req, res) => {
  const user = await getSessionUser(req.cookies?.sid);
  if (!user) return res.json({ orders: [] });
  try {
    const isAdmin = user.role === 'admin';
    const rows = isAdmin
      ? await query<any>(`SELECT o.*,u.name as customer_name,u.email as customer_email
                          FROM orders o JOIN users u ON o.user_id=u.id ORDER BY o.created_at DESC`)
      : await query<any>('SELECT * FROM orders WHERE user_id=$1 ORDER BY created_at DESC', [user.id]);
    const result = await Promise.all(rows.map(async (o) => {
      const items = await query<any>('SELECT * FROM order_items WHERE order_id=$1', [o.id]);
      return { ...o, total: Number(o.total), items };
    }));
    res.json({ orders: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/orders
router.post('/orders', async (req, res) => {
  const user = await getSessionUser(req.cookies?.sid);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  const { items, total, shipping, paymentMethod, notes } = req.body ?? {};
  if (!items?.length || !total) return res.status(400).json({ error: 'items and total required' });
  const orderId = makeId();
  try {
    await execute(
      `INSERT INTO orders (id,user_id,status,total,shipping_name,shipping_address,shipping_city,shipping_phone,payment_method,notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [orderId, user.id, 'pending', total,
       shipping?.name||null, shipping?.address||null, shipping?.city||null,
       shipping?.phone||null, paymentMethod||'card', notes||null]
    );
    for (const item of items) {
      await execute(
        'INSERT INTO order_items (order_id,product_id,name,image,price,quantity,color,size) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
        [orderId, item.productId||item.id, item.name, item.image||null, item.price, item.quantity, item.color||null, item.size||null]
      );
    }
    await execute('DELETE FROM cart_items WHERE user_id=$1', [user.id]);
    const coinsEarned = Math.floor(total);
    await execute('UPDATE users SET coins=coins+$1 WHERE id=$2', [coinsEarned, user.id]);
    await execute(
      'INSERT INTO wallet_transactions (id,user_id,type,coins,description,reference) VALUES ($1,$2,$3,$4,$5,$6)',
      [makeId(), user.id, 'earn', coinsEarned, `Coins earned from order #${orderId.slice(0,8)}`, orderId]
    );
    // Notify sellers
    for (const item of items) {
      if (item.sellerId) {
        try {
          await execute(
            'INSERT INTO notifications (user_id,title,message,type,link) VALUES ($1,$2,$3,$4,$5)',
            [item.sellerId, 'New Order', `New order for ${item.name}`, 'order', '/seller-hub']
          );
        } catch {}
      }
    }
    res.status(201).json({ orderId, status: 'pending', coinsEarned });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/orders/:id/status
router.patch('/orders/:id/status', async (req, res) => {
  const { status } = req.body ?? {};
  const valid = ['pending','processing','shipped','delivered','cancelled'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  try {
    await execute('UPDATE orders SET status=$1,updated_at=NOW() WHERE id=$2', [status, req.params.id]);
    try {
      const order = await queryOne<any>('SELECT user_id FROM orders WHERE id=$1', [req.params.id]);
      if (order) {
        await execute(
          'INSERT INTO notifications (user_id,title,message,type,link) VALUES ($1,$2,$3,$4,$5)',
          [order.user_id, 'Order Update', `Your order #${req.params.id.slice(0,8)} is now ${status}`, 'order', '/account/orders']
        );
      }
    } catch {}
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
