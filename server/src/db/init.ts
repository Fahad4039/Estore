import { pool, query, queryOne, execute } from './postgres';
import { logger } from '../lib/logger';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function initDB() {
  // Create all tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id              TEXT        PRIMARY KEY,
      name            TEXT        NOT NULL,
      email           TEXT        NOT NULL UNIQUE,
      password_hash   TEXT        NOT NULL,
      avatar          TEXT,
      role            TEXT        NOT NULL DEFAULT 'user',
      is_seller       BOOLEAN     NOT NULL DEFAULT false,
      coins           INTEGER     NOT NULL DEFAULT 0,
      wallet_balance  NUMERIC(12,2) NOT NULL DEFAULT 0,
      membership      TEXT        NOT NULL DEFAULT 'free',
      referral_code   TEXT        UNIQUE,
      bio             TEXT,
      phone           TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id          TEXT        PRIMARY KEY,
      user_id     TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at  TIMESTAMPTZ NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS products (
      id              TEXT        PRIMARY KEY,
      name            TEXT        NOT NULL,
      brand           TEXT        NOT NULL DEFAULT '',
      category        TEXT        NOT NULL DEFAULT 'General',
      price           NUMERIC(10,2) NOT NULL DEFAULT 0,
      original_price  NUMERIC(10,2) NOT NULL DEFAULT 0,
      discount        INTEGER     NOT NULL DEFAULT 0,
      rating          NUMERIC(3,2) NOT NULL DEFAULT 0,
      review_count    INTEGER     NOT NULL DEFAULT 0,
      stock           INTEGER     NOT NULL DEFAULT 0,
      description     TEXT        DEFAULT '',
      images          JSONB       DEFAULT '[]',
      tags            JSONB       DEFAULT '[]',
      specs           JSONB       DEFAULT '{}',
      colors          JSONB       DEFAULT '[]',
      sizes           JSONB       DEFAULT '[]',
      is_featured     BOOLEAN     NOT NULL DEFAULT false,
      is_trending     BOOLEAN     NOT NULL DEFAULT false,
      is_best_seller  BOOLEAN     NOT NULL DEFAULT false,
      is_flash_sale   BOOLEAN     NOT NULL DEFAULT false,
      flash_sale_price NUMERIC(10,2),
      is_new          BOOLEAN     NOT NULL DEFAULT false,
      seller_id       TEXT,
      seller_name     TEXT,
      delivery_days   INTEGER     NOT NULL DEFAULT 3,
      status          TEXT        NOT NULL DEFAULT 'active',
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id          SERIAL      PRIMARY KEY,
      user_id     TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id  TEXT        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      quantity    INTEGER     NOT NULL DEFAULT 1,
      color       TEXT,
      size        TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS wishlist_items (
      user_id     TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id  TEXT        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS seller_analytics (
      id          SERIAL      PRIMARY KEY,
      seller_id   TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      report_date DATE        NOT NULL,
      sales_count INTEGER     NOT NULL DEFAULT 0,
      revenue     NUMERIC(12,2) NOT NULL DEFAULT 0,
      views       INTEGER     NOT NULL DEFAULT 0,
      UNIQUE (seller_id, report_date)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id                TEXT        PRIMARY KEY,
      user_id           TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status            TEXT        NOT NULL DEFAULT 'pending',
      total             NUMERIC(12,2) NOT NULL,
      shipping_name     TEXT,
      shipping_address  TEXT,
      shipping_city     TEXT,
      shipping_phone    TEXT,
      payment_method    TEXT        DEFAULT 'card',
      notes             TEXT,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id          SERIAL      PRIMARY KEY,
      order_id    TEXT        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id  TEXT,
      name        TEXT        NOT NULL,
      image       TEXT,
      price       NUMERIC(10,2) NOT NULL,
      quantity    INTEGER     NOT NULL,
      color       TEXT,
      size        TEXT
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id          TEXT        PRIMARY KEY,
      product_id  TEXT        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      user_id     TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      user_name   TEXT        NOT NULL,
      user_avatar TEXT,
      rating      INTEGER     NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment     TEXT,
      helpful     INTEGER     NOT NULL DEFAULT 0,
      verified    BOOLEAN     NOT NULL DEFAULT false,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(product_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id          TEXT        PRIMARY KEY,
      user_id     TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type        TEXT        NOT NULL,
      amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
      coins       INTEGER     NOT NULL DEFAULT 0,
      description TEXT        NOT NULL,
      reference   TEXT,
      status      TEXT        NOT NULL DEFAULT 'completed',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS check_ins (
      id           SERIAL      PRIMARY KEY,
      user_id      TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      check_date   DATE        NOT NULL,
      coins_earned INTEGER     NOT NULL DEFAULT 10,
      streak       INTEGER     NOT NULL DEFAULT 1,
      UNIQUE(user_id, check_date)
    );

    CREATE TABLE IF NOT EXISTS referrals (
      id          SERIAL      PRIMARY KEY,
      referrer_id TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      referee_id  TEXT        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      bonus_coins INTEGER     NOT NULL DEFAULT 50,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS affiliators (
      id                SERIAL      PRIMARY KEY,
      user_id           TEXT        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      commission_rate   NUMERIC(5,4) NOT NULL DEFAULT 0.05,
      total_earnings    NUMERIC(12,2) NOT NULL DEFAULT 0,
      total_clicks      INTEGER     NOT NULL DEFAULT 0,
      total_conversions INTEGER     NOT NULL DEFAULT 0,
      status            TEXT        NOT NULL DEFAULT 'active',
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id          SERIAL      PRIMARY KEY,
      user_id     TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title       TEXT        NOT NULL,
      message     TEXT        NOT NULL,
      type        TEXT        NOT NULL DEFAULT 'info',
      is_read     BOOLEAN     NOT NULL DEFAULT false,
      link        TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_unique ON cart_items(user_id, product_id, COALESCE(color,''), COALESCE(size,''));
    CREATE INDEX IF NOT EXISTS idx_products_category   ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_seller     ON products(seller_id);
    CREATE INDEX IF NOT EXISTS idx_products_featured   ON products(is_featured);
    CREATE INDEX IF NOT EXISTS idx_products_flash      ON products(is_flash_sale);
    CREATE INDEX IF NOT EXISTS idx_cart_user           ON cart_items(user_id);
    CREATE INDEX IF NOT EXISTS idx_wishlist_user       ON wishlist_items(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_user         ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_product     ON reviews(product_id);
    CREATE INDEX IF NOT EXISTS idx_wallet_user         ON wallet_transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_checkins_user       ON check_ins(user_id);
    CREATE INDEX IF NOT EXISTS idx_notif_user          ON notifications(user_id);
  `);

  // Auth extensions are kept as idempotent ALTER statements so existing
  // PostgreSQL databases receive the new auth fields without being recreated.
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS banned BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS firebase_uid TEXT;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS flash_sale_price NUMERIC(10,2);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_firebase_uid
      ON users(firebase_uid) WHERE firebase_uid IS NOT NULL;
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      token_hash  TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at  TIMESTAMPTZ NOT NULL,
      used_at     TIMESTAMPTZ,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_password_reset_user
      ON password_reset_tokens(user_id);
  `);

  logger.info('PostgreSQL tables created/verified');

  // Seed admin user
  const adminExists = await queryOne('SELECT id FROM users WHERE email=$1', ['admin@estore.com']);
  if (!adminExists) {
    const hash = await bcrypt.hash('admin123', 12);
    await execute(
      `INSERT INTO users (id,name,email,password_hash,role,referral_code,coins,wallet_balance)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING`,
      ['admin-001','Admin','admin@estore.com',hash,'admin','ADMIN001',500,100]
    );
    logger.info('Admin seeded: admin@estore.com / admin123');
  }

  // Seed products if empty
  const cnt = (await queryOne<any>('SELECT COUNT(*) as cnt FROM products'))?.cnt ?? 0;
  if (Number(cnt) === 0) {
    await seedProducts();
  } else {
    logger.info({ count: cnt }, 'Products already seeded');
  }
}

async function seedProducts() {
  const seedPath = join(__dirname, 'products-seed.json');
  let products: any[] = [];
  try {
    products = JSON.parse(readFileSync(seedPath, 'utf8'));
  } catch {
    logger.warn('products-seed.json not found — skipping product seed');
    return;
  }

  let inserted = 0;
  for (const p of products) {
    try {
      await execute(
        `INSERT INTO products
          (id,name,brand,category,price,original_price,discount,rating,review_count,
           stock,description,images,tags,specs,colors,sizes,
           is_featured,is_trending,is_best_seller,is_flash_sale,is_new,
           seller_id,seller_name,delivery_days)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
         ON CONFLICT DO NOTHING`,
        [
          p.id, p.name, p.brand||'', p.category||'General',
          p.price||0, p.originalPrice??p.price??0, p.discount??0,
          p.rating??0, p.reviewCount??0, p.stock??0, p.description||'',
          JSON.stringify(p.images??[]), JSON.stringify(p.tags??[]),
          JSON.stringify(p.specifications??p.specs??{}),
          JSON.stringify(p.colors??[]), JSON.stringify(p.sizes??[]),
          p.isFeatured??false, p.isTrending??false, p.isBestSeller??false,
          p.isFlashSale??false, p.isNew??false,
          p.sellerId??null, p.sellerName??null, p.deliveryDays??3,
        ]
      );
      inserted++;
    } catch (err: any) {
      logger.warn({ id: p.id, err: err.message }, 'Seed insert failed');
    }
  }
  logger.info({ inserted }, 'Products seeded');
}
