import { Router } from 'express';
import { query, queryOne, execute } from '../db/postgres';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const router = Router();

let staticProducts: any[] = [];
try { staticProducts = JSON.parse(readFileSync(join(__dirname, '../db/products-seed.json'), 'utf8')); } catch {}

function dbRow(r: any) {
  const specs = r.specs ?? {};
  return {
    id: r.id, name: r.name, brand: r.brand, category: r.category,
    price: Number(r.price), originalPrice: Number(r.original_price),
    discount: Number(r.discount ?? 0), rating: Number(r.rating),
    reviewCount: r.review_count, stock: r.stock, description: r.description || '',
    images: r.images ?? [], tags: r.tags ?? [],
    specifications: specs, specs,
    colors: r.colors ?? [], sizes: r.sizes ?? [],
    isFeatured: r.is_featured, isTrending: r.is_trending,
    isBestSeller: r.is_best_seller, isFlashSale: r.is_flash_sale, isNew: r.is_new,
    sellerId: r.seller_id || null, sellerName: r.seller_name || null,
    deliveryDays: r.delivery_days ?? 3, status: r.status || 'active',
  };
}

// GET /api/products
router.get('/products', async (req, res) => {
  try {
    const { category, featured, trending, bestSeller, flashSale, isNew, search, seller } = req.query;
    const conditions: string[] = ['status=$1'];
    const params: any[] = ['active'];
    let n = 2;
    if (category)     { conditions.push(`category=$${n++}`);       params.push(category); }
    if (featured === '1')    { conditions.push(`is_featured=true`); }
    if (trending === '1')    { conditions.push(`is_trending=true`); }
    if (bestSeller === '1')  { conditions.push(`is_best_seller=true`); }
    if (flashSale === '1')   { conditions.push(`is_flash_sale=true`); }
    if (isNew === '1')       { conditions.push(`is_new=true`); }
    if (seller)       { conditions.push(`seller_id=$${n++}`);       params.push(seller); }
    if (search) {
      const s = `%${search}%`;
      conditions.push(`(name ILIKE $${n} OR brand ILIKE $${n+1} OR category ILIKE $${n+2})`);
      params.push(s, s, s); n += 3;
    }
    const rows = await query(`SELECT * FROM products WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`, params);
    res.json({ data: rows.map(dbRow), source: 'postgresql' });
  } catch {
    res.json({ data: staticProducts, source: 'static' });
  }
});

// GET /api/products/:id
router.get('/products/:id', async (req, res) => {
  try {
    const row = await queryOne('SELECT * FROM products WHERE id=$1', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(dbRow(row));
  } catch {
    const p = staticProducts.find((p: any) => p.id === req.params.id);
    return p ? res.json(p) : res.status(404).json({ error: 'Not found' });
  }
});

// POST /api/products
router.post('/products', async (req, res) => {
  const p = req.body;
  if (!p?.name) return res.status(400).json({ error: 'name required' });
  const { randomBytes } = await import('crypto');
  const id = p.id || randomBytes(8).toString('hex');
  const specsData = p.specifications ?? p.specs ?? {};
  try {
    await execute(
      `INSERT INTO products (id,name,brand,category,price,original_price,discount,rating,
        review_count,stock,description,images,tags,specs,colors,sizes,
        is_featured,is_trending,is_best_seller,is_flash_sale,is_new,seller_id,seller_name,delivery_days,status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)`,
      [id, p.name, p.brand||'', p.category||'General',
       p.price||0, p.originalPrice||p.price||0, p.discount||0, p.rating||0,
       p.reviewCount||0, p.stock||0, p.description||'',
       JSON.stringify(p.images||[]), JSON.stringify(p.tags||[]),
       JSON.stringify(specsData), JSON.stringify(p.colors||[]), JSON.stringify(p.sizes||[]),
       p.isFeatured??false, p.isTrending??false, p.isBestSeller??false,
       p.isFlashSale??false, p.isNew??false,
       p.sellerId||null, p.sellerName||null, p.deliveryDays||3, p.status||'active']
    );
    const row = await queryOne('SELECT * FROM products WHERE id=$1', [id]);
    res.status(201).json({ success: true, id, product: row ? dbRow(row) : null });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/products/:id
router.put('/products/:id', async (req, res) => {
  const p = req.body;
  const setClauses: string[] = [];
  const vals: any[] = [];
  let n = 1;
  const map: Record<string, string> = {
    name:'name', brand:'brand', category:'category', price:'price',
    originalPrice:'original_price', discount:'discount', rating:'rating',
    reviewCount:'review_count', stock:'stock', description:'description',
    isFeatured:'is_featured', isTrending:'is_trending', isBestSeller:'is_best_seller',
    isFlashSale:'is_flash_sale', isNew:'is_new',
    sellerId:'seller_id', sellerName:'seller_name', deliveryDays:'delivery_days', status:'status',
  };
  for (const [k, col] of Object.entries(map)) {
    if (k in p) { setClauses.push(`${col}=$${n++}`); vals.push(p[k]); }
  }
  for (const k of ['images','tags','colors','sizes']) {
    if (k in p) { setClauses.push(`${k}=$${n++}`); vals.push(JSON.stringify(p[k])); }
  }
  if ('specs' in p || 'specifications' in p) {
    setClauses.push(`specs=$${n++}`); vals.push(JSON.stringify(p.specs ?? p.specifications));
  }
  setClauses.push(`updated_at=NOW()`);
  if (!setClauses.length) return res.status(400).json({ error: 'No fields to update' });
  vals.push(req.params.id);
  try {
    await execute(`UPDATE products SET ${setClauses.join(',')} WHERE id=$${n}`, vals);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/products/:id
router.delete('/products/:id', async (req, res) => {
  try {
    await execute('DELETE FROM products WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
