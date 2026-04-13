-- =============================================
-- AETERIUM ECOM DROP — Schema Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =============================================

-- 1. Tabla de productos (cache + historial de márgenes)
CREATE TABLE IF NOT EXISTS products (
  id          BIGSERIAL PRIMARY KEY,
  dropea_id   TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  stock       INTEGER DEFAULT 0,
  cost        NUMERIC(10,2),
  pvp         NUMERIC(10,2),
  margin      NUMERIC(10,2),
  category    TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de estrategias generadas por AETERIUM
CREATE TABLE IF NOT EXISTS strategies (
  id            BIGSERIAL PRIMARY KEY,
  dropea_id     TEXT NOT NULL,
  product_name  TEXT,
  strategy_md   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de órdenes sincronizadas con Dropea
CREATE TABLE IF NOT EXISTS orders (
  id                BIGSERIAL PRIMARY KEY,
  dropea_order_id   TEXT,
  customer_name     TEXT NOT NULL,
  customer_phone    TEXT,
  shipping_address  TEXT NOT NULL,
  payment_method    TEXT DEFAULT 'COD',
  product_id        TEXT NOT NULL,
  status            TEXT DEFAULT 'pending',
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla de publicaciones (tracking multizona)
CREATE TABLE IF NOT EXISTS listings (
  id            BIGSERIAL PRIMARY KEY,
  product_id    TEXT NOT NULL,
  product_name  TEXT,
  platform      TEXT NOT NULL, -- 'wallapop', 'facebook', 'milanuncios'
  city          TEXT NOT NULL, -- 'Granada', 'Sevilla', 'Malaga', 'Madrid'
  listing_url   TEXT,
  copy_used     TEXT,
  published_at  TIMESTAMPTZ DEFAULT NOW(),
  sold          BOOLEAN DEFAULT FALSE,
  sale_price    NUMERIC(10,2)
);

-- Índices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_products_margin ON products(margin DESC);
CREATE INDEX IF NOT EXISTS idx_listings_city ON listings(city);
CREATE INDEX IF NOT EXISTS idx_listings_sold ON listings(sold);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- RLS: deshabilitar para uso privado (panel admin)
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE strategies DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE listings DISABLE ROW LEVEL SECURITY;
