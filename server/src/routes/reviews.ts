import { Router, type IRouter } from 'express';
import { query, queryOne, execute } from '../db/postgres';
import { randomBytes } from 'crypto';

const router: IRouter = Router();
function makeId() { return randomBytes(8).toString('hex'); }

async function getSessionUser(sid: string | undefined): Promise<any | null> {
  if (!sid) return null;
  return queryOne<any>(
    `SELECT u.id,u.name,u.avatar FROM sessions s JOIN users u ON s.user_id=u.id
     WHERE s.id=$1 AND s.expires_at > NOW()`, [sid]
  );
}

// GET /api/reviews/:productId
router.get('/reviews/:productId', async (req, res) => {
  try {
    const reviews = await query<any>(
      'SELECT * FROM reviews WHERE product_id=$1 ORDER BY created_at DESC', [req.params.productId]
    );
    const stats = await queryOne<any>(
      `SELECT AVG(rating)::numeric(3,2) as avg_rating, COUNT(*) as total,
              COUNT(*) FILTER (WHERE rating=5) as r5,
              COUNT(*) FILTER (WHERE rating=4) as r4,
              COUNT(*) FILTER (WHERE rating=3) as r3,
              COUNT(*) FILTER (WHERE rating=2) as r2,
              COUNT(*) FILTER (WHERE rating=1) as r1
       FROM reviews WHERE product_id=$1`, [req.params.productId]
    );
    res.json({ reviews, stats });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reviews/:productId
router.post('/reviews/:productId', async (req, res) => {
  const user = await getSessionUser(req.cookies?.sid);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  const { rating, comment } = req.body ?? {};
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'rating 1-5 required' });
  try {
    const id = makeId();
    await execute(
      `INSERT INTO reviews (id,product_id,user_id,user_name,user_avatar,rating,comment,verified)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (product_id,user_id) DO UPDATE SET rating=$6,comment=$7,verified=$8`,
      [id, req.params.productId, user.id, user.name, user.avatar||null, rating, comment||null, true]
    );
    const stats = await queryOne<any>(
      'SELECT AVG(rating)::numeric(3,2) as avg, COUNT(*) as cnt FROM reviews WHERE product_id=$1',
      [req.params.productId]
    );
    if (stats) {
      await execute('UPDATE products SET rating=$1,review_count=$2,updated_at=NOW() WHERE id=$3',
        [stats.avg, stats.cnt, req.params.productId]);
    }
    await execute('UPDATE users SET coins=coins+5 WHERE id=$1', [user.id]);
    res.status(201).json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reviews/:productId/helpful/:reviewId
router.post('/reviews/:productId/helpful/:reviewId', async (req, res) => {
  try {
    await execute('UPDATE reviews SET helpful=helpful+1 WHERE id=$1 AND product_id=$2',
      [req.params.reviewId, req.params.productId]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
