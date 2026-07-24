import { Router, type IRouter } from 'express';
import { query, queryOne, execute } from '../db/postgres';

const router: IRouter = Router();

async function getSessionUserId(sid: string | undefined): Promise<string | null> {
  if (!sid) return null;
  const row = await queryOne<any>('SELECT user_id FROM sessions WHERE id=$1 AND expires_at > NOW()', [sid]);
  return row?.user_id ?? null;
}

// GET /api/wishlist
router.get('/wishlist', async (req, res) => {
  const userId = await getSessionUserId(req.cookies?.sid);
  if (!userId) return res.json({ items: [] });
  try {
    const items = await query<any>(
      `SELECT p.id,p.name,p.price,p.original_price,p.images,p.rating,p.review_count,p.discount
       FROM wishlist_items w JOIN products p ON w.product_id=p.id
       WHERE w.user_id=$1 ORDER BY w.created_at DESC`, [userId]
    );
    const parsed = items.map(i => ({
      ...i, price: Number(i.price), originalPrice: Number(i.original_price),
      images: i.images ?? [], rating: Number(i.rating),
    }));
    res.json({ items: parsed });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/wishlist/:productId  (toggle)
router.post('/wishlist/:productId', async (req, res) => {
  const userId = await getSessionUserId(req.cookies?.sid);
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  const { productId } = req.params;
  try {
    const exists = await queryOne('SELECT 1 FROM wishlist_items WHERE user_id=$1 AND product_id=$2', [userId, productId]);
    if (exists) {
      await execute('DELETE FROM wishlist_items WHERE user_id=$1 AND product_id=$2', [userId, productId]);
      res.json({ added: false });
    } else {
      await execute('INSERT INTO wishlist_items (user_id,product_id) VALUES ($1,$2)', [userId, productId]);
      res.json({ added: true });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/wishlist/:productId
router.delete('/wishlist/:productId', async (req, res) => {
  const userId = await getSessionUserId(req.cookies?.sid);
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  try {
    await execute('DELETE FROM wishlist_items WHERE user_id=$1 AND product_id=$2', [userId, req.params.productId]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
