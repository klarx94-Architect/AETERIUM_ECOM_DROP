-- =============================================
-- AETERIUM ECOM DROP — Schema Tops Manuales
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- (¡Asegúrate de no borrar las tablas existentes!)
-- =============================================

create table if not exists tops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  type text not null,
  category text,
  status text not null default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists top_products (
  id uuid primary key default gen_random_uuid(),
  top_id uuid not null references tops(id) on delete cascade,
  product_id text not null,
  name text not null,
  category text,
  margin numeric,
  stock integer,
  status text not null default 'in_test',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Habilitar y luego deshabilitar RLS para uso privado del admin (coherencia con el resto)
ALTER TABLE tops DISABLE ROW LEVEL SECURITY;
ALTER TABLE top_products DISABLE ROW LEVEL SECURITY;
