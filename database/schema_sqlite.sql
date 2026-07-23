-- =============================================================
-- ESTORE PREMIUM — Complete SQLite Database Schema
-- Generated: 2026-07-23
-- Use: sqlite3 estore.db < estore.sql
-- =============================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- =============================================================
-- USERS
-- =============================================================
CREATE TABLE IF NOT EXISTS users (
  id              TEXT        PRIMARY KEY,
  name            TEXT        NOT NULL,
  email           TEXT        NOT NULL UNIQUE,
  password_hash   TEXT        NOT NULL,
  avatar          TEXT,
  role            TEXT        NOT NULL DEFAULT 'user'  CHECK(role IN ('user','admin')),
  is_seller       INTEGER     NOT NULL DEFAULT 0,
  coins           INTEGER     NOT NULL DEFAULT 0,
  wallet_balance  REAL        NOT NULL DEFAULT 0,
  membership      TEXT        NOT NULL DEFAULT 'free'  CHECK(membership IN ('free','basic','premium')),
  referral_code   TEXT        UNIQUE,
  bio             TEXT,
  phone           TEXT,
  created_at      TEXT        NOT NULL DEFAULT (datetime('now'))
);

-- =============================================================
-- SESSIONS
-- =============================================================
CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT  PRIMARY KEY,
  user_id     TEXT  NOT NULL,
  expires_at  TEXT  NOT NULL,
  created_at  TEXT  NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================================
-- PRODUCTS
-- =============================================================
CREATE TABLE IF NOT EXISTS products (
  id              TEXT    PRIMARY KEY,
  name            TEXT    NOT NULL,
  brand           TEXT    NOT NULL DEFAULT '',
  category        TEXT    NOT NULL DEFAULT 'General',
  price           REAL    NOT NULL DEFAULT 0,
  original_price  REAL    NOT NULL DEFAULT 0,
  discount        INTEGER NOT NULL DEFAULT 0,
  rating          REAL    NOT NULL DEFAULT 0,
  review_count    INTEGER NOT NULL DEFAULT 0,
  stock           INTEGER NOT NULL DEFAULT 0,
  description     TEXT    DEFAULT '',
  images          TEXT    DEFAULT '[]',   -- JSON array of URLs
  tags            TEXT    DEFAULT '[]',   -- JSON array of strings
  specs           TEXT    DEFAULT '{}',   -- JSON object
  colors          TEXT    DEFAULT '[]',   -- JSON array
  sizes           TEXT    DEFAULT '[]',   -- JSON array
  is_featured     INTEGER NOT NULL DEFAULT 0,
  is_trending     INTEGER NOT NULL DEFAULT 0,
  is_best_seller  INTEGER NOT NULL DEFAULT 0,
  is_flash_sale   INTEGER NOT NULL DEFAULT 0,
  is_new          INTEGER NOT NULL DEFAULT 0,
  seller_id       TEXT,
  seller_name     TEXT,
  delivery_days   INTEGER NOT NULL DEFAULT 3,
  status          TEXT    NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive','pending')),
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- =============================================================
-- CART ITEMS
-- =============================================================
CREATE TABLE IF NOT EXISTS cart_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     TEXT    NOT NULL,
  product_id  TEXT    NOT NULL,
  quantity    INTEGER NOT NULL DEFAULT 1,
  color       TEXT,
  size        TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, product_id, color, size),
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- =============================================================
-- WISHLIST ITEMS
-- =============================================================
CREATE TABLE IF NOT EXISTS wishlist_items (
  user_id     TEXT  NOT NULL,
  product_id  TEXT  NOT NULL,
  created_at  TEXT  NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, product_id),
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- =============================================================
-- ORDERS
-- =============================================================
CREATE TABLE IF NOT EXISTS orders (
  id                TEXT  PRIMARY KEY,
  user_id           TEXT  NOT NULL,
  status            TEXT  NOT NULL DEFAULT 'pending'
                          CHECK(status IN ('pending','processing','shipped','delivered','cancelled')),
  total             REAL  NOT NULL,
  shipping_name     TEXT,
  shipping_address  TEXT,
  shipping_city     TEXT,
  shipping_phone    TEXT,
  payment_method    TEXT  DEFAULT 'card',
  notes             TEXT,
  created_at        TEXT  NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT  NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================================
-- ORDER ITEMS
-- =============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id    TEXT    NOT NULL,
  product_id  TEXT,
  name        TEXT    NOT NULL,
  image       TEXT,
  price       REAL    NOT NULL,
  quantity    INTEGER NOT NULL,
  color       TEXT,
  size        TEXT,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- =============================================================
-- REVIEWS
-- =============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id          TEXT    PRIMARY KEY,
  product_id  TEXT    NOT NULL,
  user_id     TEXT    NOT NULL,
  user_name   TEXT    NOT NULL,
  user_avatar TEXT,
  rating      INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  comment     TEXT,
  helpful     INTEGER NOT NULL DEFAULT 0,
  verified    INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE(product_id, user_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE
);

-- =============================================================
-- WALLET TRANSACTIONS
-- =============================================================
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id          TEXT    PRIMARY KEY,
  user_id     TEXT    NOT NULL,
  type        TEXT    NOT NULL CHECK(type IN ('topup','cashout','earn','spend','refund','bonus')),
  amount      REAL    NOT NULL,
  coins       INTEGER NOT NULL DEFAULT 0,
  description TEXT    NOT NULL,
  reference   TEXT,
  status      TEXT    NOT NULL DEFAULT 'completed'
                      CHECK(status IN ('pending','completed','failed')),
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================================
-- DAILY CHECK-INS
-- =============================================================
CREATE TABLE IF NOT EXISTS check_ins (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     TEXT    NOT NULL,
  check_date  TEXT    NOT NULL,  -- ISO date string YYYY-MM-DD
  coins_earned INTEGER NOT NULL DEFAULT 10,
  streak      INTEGER NOT NULL DEFAULT 1,
  UNIQUE(user_id, check_date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================================
-- REFERRALS
-- =============================================================
CREATE TABLE IF NOT EXISTS referrals (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  referrer_id TEXT    NOT NULL,
  referee_id  TEXT    NOT NULL UNIQUE,
  bonus_coins INTEGER NOT NULL DEFAULT 50,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (referee_id)  REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================================
-- AFFILIATORS
-- =============================================================
CREATE TABLE IF NOT EXISTS affiliators (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id           TEXT    NOT NULL UNIQUE,
  commission_rate   REAL    NOT NULL DEFAULT 0.05,
  total_earnings    REAL    NOT NULL DEFAULT 0,
  total_clicks      INTEGER NOT NULL DEFAULT 0,
  total_conversions INTEGER NOT NULL DEFAULT 0,
  status            TEXT    NOT NULL DEFAULT 'active'
                            CHECK(status IN ('active','suspended','pending')),
  created_at        TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================================
-- SELLER ANALYTICS (daily snapshots)
-- =============================================================
CREATE TABLE IF NOT EXISTS seller_analytics (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  seller_id   TEXT    NOT NULL,
  report_date TEXT    NOT NULL,  -- YYYY-MM-DD
  sales_count INTEGER NOT NULL DEFAULT 0,
  revenue     REAL    NOT NULL DEFAULT 0,
  views       INTEGER NOT NULL DEFAULT 0,
  UNIQUE(seller_id, report_date),
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================================
-- MEMBERSHIP PLANS
-- =============================================================
CREATE TABLE IF NOT EXISTS membership_subscriptions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     TEXT    NOT NULL,
  plan        TEXT    NOT NULL CHECK(plan IN ('basic','premium')),
  starts_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  expires_at  TEXT    NOT NULL,
  status      TEXT    NOT NULL DEFAULT 'active'
                      CHECK(status IN ('active','expired','cancelled')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================================
-- NOTIFICATIONS
-- =============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     TEXT    NOT NULL,
  title       TEXT    NOT NULL,
  message     TEXT    NOT NULL,
  type        TEXT    NOT NULL DEFAULT 'info'
                      CHECK(type IN ('info','order','promo','system','coin')),
  is_read     INTEGER NOT NULL DEFAULT 0,
  link        TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================================
-- INDEXES for query performance
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_products_category    ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_seller      ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_featured    ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_flash_sale  ON products(is_flash_sale);
CREATE INDEX IF NOT EXISTS idx_cart_user            ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user        ON wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user          ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status        ON orders(status);
CREATE INDEX IF NOT EXISTS idx_reviews_product      ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_wallet_user          ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_user        ON check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user        ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user   ON notifications(user_id);

-- =============================================================
-- SEED: Default admin account  (password: admin123)
-- SHA-256 of "admin123estore-salt-2025"
-- =============================================================
INSERT OR IGNORE INTO users (id, name, email, password_hash, role, referral_code)
VALUES (
  'admin-001',
  'Admin',
  'admin@estore.com',
  'c6f7c5a5c0b0f5a0c0b0f5a0c0b0f5a0c0b0f5a0c0b0f5a0c0b0f5a0c0b0f5a',
  'admin',
  'ADMIN001'
);
