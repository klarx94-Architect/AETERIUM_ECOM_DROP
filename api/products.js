import { createClient } from '@supabase/supabase-js';
import { dropeaQuery } from '../dropea_connector.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const CATALOG_QUERY = `
  query GetMarketData($limit: Int) {
    products(limit: $limit) {
      data { id name stock_available cost_price pvpr category }
    }
  }
`;

function mapProducts(raw) {
  return raw.map(p => ({
    id: p.id,
    name: p.name,
    stock: p.stock_available,
    cost: p.cost_price,
    pvp: p.pvpr,
    margin: +(p.pvpr - p.cost_price).toFixed(2),
    category: p.category
  }));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // Intentar desde Dropea live
    const result = await dropeaQuery(CATALOG_QUERY, { limit: 100 });
    if (result.errors) throw new Error(result.errors[0].message);
    let items = mapProducts(result.data?.products?.data || []);
    items.sort((a, b) => b.margin - a.margin);
    const top50 = items.slice(0, 50);

    // Guardar en Supabase para persistencia
    if (supabase && process.env.SUPABASE_URL) {
      const upsertData = top50.map(p => ({
        dropea_id: String(p.id),
        name: p.name,
        stock: p.stock,
        cost: p.cost,
        pvp: p.pvp,
        margin: p.margin,
        category: p.category,
        updated_at: new Date().toISOString()
      }));
      await supabase.from('products').upsert(upsertData, { onConflict: 'dropea_id' });
    }

    return res.status(200).json(top50);
  } catch (e) {
    console.error('[products] Dropea error, using Supabase cache:', e.message);
    // Fallback: leer desde Supabase
    if (supabase && process.env.SUPABASE_URL) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('margin', { ascending: false })
        .limit(50);
      if (!error && data?.length) return res.status(200).json(data);
    }
    return res.status(500).json({ error: e.message });
  }
}
