export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS images (
  id TEXT PRIMARY KEY,
  mime TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  banned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'Gamepad2',
  color TEXT NOT NULL DEFAULT '#FF6A13',
  image_id TEXT,
  sort INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  show_in_bar BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS listings (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category_id INT REFERENCES categories(id) ON DELETE SET NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(12,2) NOT NULL,
  old_price NUMERIC(12,2),
  cover_image_id TEXT,
  delivery_type TEXT NOT NULL DEFAULT 'auto',
  manual_stock INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  featured BOOLEAN NOT NULL DEFAULT false,
  sold_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  listing_id INT REFERENCES listings(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  quantity INT NOT NULL,
  delivery_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  delivered_content TEXT,
  delivered_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS stock_codes (
  id SERIAL PRIMARY KEY,
  listing_id INT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  order_item_id INT REFERENCES order_items(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS stock_free_idx ON stock_codes(listing_id) WHERE order_item_id IS NULL;

CREATE TABLE IF NOT EXISTS refund_requests (
  id SERIAL PRIMARY KEY,
  order_item_id INT NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS favorites (
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id INT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, listing_id)
);

CREATE TABLE IF NOT EXISTS payment_methods (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'bank',
  account_name TEXT NOT NULL DEFAULT '',
  account_no TEXT NOT NULL DEFAULT '',
  instructions TEXT NOT NULL DEFAULT '',
  commission NUMERIC(5,2) NOT NULL DEFAULT 0,
  min_amount NUMERIC(12,2) NOT NULL DEFAULT 10,
  active BOOLEAN NOT NULL DEFAULT true,
  sort INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS deposits (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  method_id INT REFERENCES payment_methods(id) ON DELETE SET NULL,
  method_name TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  sender_name TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS balance_logs (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  kind TEXT NOT NULL DEFAULT 'info',
  link TEXT NOT NULL DEFAULT '',
  in_ticker BOOLEAN NOT NULL DEFAULT true,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS banners (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  cta_text TEXT NOT NULL DEFAULT 'Hemen al',
  cta_link TEXT NOT NULL DEFAULT '/ilanlar',
  label TEXT NOT NULL DEFAULT '',
  theme TEXT NOT NULL DEFAULT 'ember',
  image_id TEXT,
  sort INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS blog_posts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  cover_image_id TEXT,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL DEFAULT 'genel',
  order_id INT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ticket_messages (
  id SERIAL PRIMARY KEY,
  ticket_id INT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  is_staff BOOLEAN NOT NULL DEFAULT false,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

// Sonradan eklenen tablolar/kolonlar (mevcut veritabanlarını da günceller)
export const MIGRATIONS_SQL = `
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;

CREATE TABLE IF NOT EXISTS coupons (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL DEFAULT 'percent',
  value NUMERIC(12,2) NOT NULL,
  min_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  max_uses INT,
  used_count INT NOT NULL DEFAULT 0,
  per_user_once BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS faqs (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS admin_logs (
  id SERIAL PRIMARY KEY,
  admin_id INT REFERENCES users(id) ON DELETE SET NULL,
  admin_name TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS login_attempts (
  key TEXT PRIMARY KEY,
  fails INT NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_user_idx ON orders(user_id);
CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items(order_id);
CREATE INDEX IF NOT EXISTS listings_cat_idx ON listings(category_id);
`;

// Shopier ödeme ve OSB (otomatik sipariş bildirimi)
export const SHOPIER_SQL = `
ALTER TABLE listings ADD COLUMN IF NOT EXISTS shopier_product_id TEXT;

CREATE TABLE IF NOT EXISTS shopier_payments (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  charge NUMERIC(12,2) NOT NULL,
  items TEXT,
  coupon_code TEXT,
  buyer_name TEXT NOT NULL DEFAULT '',
  buyer_surname TEXT NOT NULL DEFAULT '',
  buyer_phone TEXT NOT NULL DEFAULT '',
  random_nr TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_id TEXT,
  installment TEXT,
  order_id INT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS shopier_payments_user_idx ON shopier_payments(user_id);

CREATE TABLE IF NOT EXISTS osb_orders (
  id SERIAL PRIMARY KEY,
  shopier_order_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL DEFAULT '',
  buyer_name TEXT NOT NULL DEFAULT '',
  price NUMERIC(12,2),
  currency TEXT NOT NULL DEFAULT 'TRY',
  product_ids TEXT NOT NULL DEFAULT '',
  product_count INT NOT NULL DEFAULT 1,
  customer_note TEXT NOT NULL DEFAULT '',
  is_test BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',
  delivered_content TEXT,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  order_id INT,
  email_sent BOOLEAN NOT NULL DEFAULT false,
  note TEXT,
  raw TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;
