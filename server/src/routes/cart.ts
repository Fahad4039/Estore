import { Router } from 'express';
import { query, queryOne, execute } from '../db/postgres';

const router = Router();

async function getSessionUserId(sid: string | undefined): Promise<string | null> {
  if (!sid) return null;
  const row = await queryOne<any>('SELECT user_id FROM sessions WHERE id=$1 AND expires_at > NOW()', [sid]);
  return row?.user_id ?? null;
}

// GET /api/cart
router.get('/cart', async (req, res) => {
  const userId = await getSessionUserId(req.cookies?.sid);
  if (!userId) return res.json({ items: [] });
  try {
    const items = await query<any>(
      `SELECT c.id, c.product_id, c.quantity, c.color, c.size,
              p.name, p.price, p.original_price, p.images, p.stock, p.seller_id, p.seller_name
       FROM cart_items c JOIN products p ON c.product_id=p.id WHERE c.user_id=$1`, [userId]
    );
    const parsed = items.map(i => ({
      ...i, price: Number(i.price), originalPrice: Number(i.original_price),
      images: i.images ?? [],
    }));
    res.json({ items: parsed });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cart
router.post('/cart', async (req, res) => {
  const userId = await getSessionUserId(req.cookies?.sid);
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  const { productId, quantity = 1, color = null, size = null } = req.body ?? {};
  if (!productId) return res.status(400).json({ error: 'productId required' });
  try {
    const existing = await queryOne<any>(
      `SELECT id,quantity FROM cart_items
       WHERE user_id=$1 AND product_id=$2 AND COALESCE(color,'')=COALESCE($3,'') AND COALESCE(size,'')=COALESCE($4,'')`,
      [userId, productId, color, size]
    );
    if (existing) {
      await execute('UPDATE cart_items SET quantity=$1 WHERE id=$2', [existing.quantity + quantity, existing.id]);
    } else {
      await execute('INSERT INTO cart_items (user_id,product_id,quantity,color,size) VALUES ($1,$2,$3,$4,$5)',
        [userId, productId, quantity, color, size]);
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/cart/:id
router.put('/cart/:id', async (req, res) => {
  const userId = await getSessionUserId(req.cookies?.sid);
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  const { quantity } = req.body ?? {};
  if (!quantity || quantity < 1) return res.status(400).json({ error: 'quantity >= 1 required' });
  try {
    await execute('UPDATE cart_items SET quantity=$1 WHERE id=$2 AND user_id=$3', [quantity, req.params.id, userId]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/cart/:id
router.delete('/cart/:id', async (req, res) => {
  const userId = await getSessionUserId(req.cookies?.sid);
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  try {
    await execute('DELETE FROM cart_items WHERE id=$1 AND user_id=$2', [req.params.id, userId]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/cart
router.delete('/cart', async (req, res) => {
  const userId = await getSessionUserId(req.cookies?.sid);
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  try {
    await execute('DELETE FROM cart_items WHERE user_id=$1', [userId]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
