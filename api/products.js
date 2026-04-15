import { createClient } from '@supabase/supabase-js';
import { dropeaQuery } from '../dropea_connector.js';

let supabase = null;
try {
  if (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY) {
    supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );
  }
} catch (err) {
  console.error("Error top-level init Supabase en /api/products:", err.message);
}

const CATALOG_QUERY = `
  query GetMarketData($limit: Int) {
    products(limit: $limit) {
      data { id name stock_available cost_price pvpr category }
    }
  }
`;

function mapProducts(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(p => ({
    id: p.id || 'N/A',
    name: p.name || 'Sin nombre',
    stock: p.stock_available || 0,
    cost: p.cost_price || 0,
    pvp: p.pvpr || 0,
    margin: +((p.pvpr || 0) - (p.cost_price || 0)).toFixed(2),
    category: p.category || 'Sin categoría'
  }));
}

export default async function handler(req, res) {
  // Manejo absoluto de cualquier excepción no capturada en el handler
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
      // Intentar desde Dropea live
      const result = await dropeaQuery(CATALOG_QUERY, { limit: 100 });
      if (result && result.errors) throw new Error(result.errors[0]?.message);
      
      let items = mapProducts(result?.data?.products?.data || []);
      items.sort((a, b) => b.margin - a.margin);
      const top50 = items.slice(0, 50);

      // Guardar en Supabase para persistencia
      if (supabase) {
        try {
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
        } catch (dbErr) {
          console.error('[products] Add to cache error:', dbErr.message);
          // Falla silente para la BD si la API de Dropea ya tiró datos geniales
        }
      }

      return res.status(200).json(top50);
    } catch (e) {
      console.error('[products] Dropea error, using Supabase cache fallback:', e.message);
      
      // Fallback: leer desde Supabase
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('margin', { ascending: false })
            .limit(50);
            
          if (!error && Array.isArray(data) && data.length > 0) {
            return res.status(200).json(data);
          }
        } catch (dbErr) {
          console.error('[products] Supabase fallback error:', dbErr.message);
        }
      }
      
      // Si no hay Supabase ni Dropea, devolver fallback de seguridad vacío 
      // y HTTP 200 para que el frontend no estalle.
      return res.status(200).json([]);
    }
  } catch (fatalError) {
    console.error('[products] CRITICAL FATAL ERROR:', fatalError);
    // Asegurar que el contrato frontend no se rompe enviando siempre un array si es GET API
    return res.status(200).json([]);
  }
}
