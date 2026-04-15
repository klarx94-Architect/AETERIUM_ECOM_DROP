import { createClient } from '@supabase/supabase-js';

let supabase = null;
try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
  }
} catch (err) {
  console.error("Error top-level init Supabase en /api/create-top-manual:", err.message);
}

export default async function handler(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'POST') {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host || req.headers['x-vercel-deployment-url'];
    
    if (!host) {
        return res.status(500).json({ error: "No se pudo resolver el host para la llamada interna." });
    }

    const apiUrl = `${protocol}://${host}/api/products`;
    console.log("[TOP CREATOR] Lanzando petición a:", apiUrl);

    let products = [];
    try {
      const productReq = await fetch(apiUrl);
      if (!productReq.ok) {
          console.error(`create-top-manual: /api/products respondió ${productReq.status}`);
          return res.status(500).json({ error: 'No se pudo generar el Top Manual. Catálogo vacío o inaccesible.' });
      }
      
      const data = await productReq.json();
      products = Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('create-top-manual: error obteniendo productos', err.stack || err);
      return res.status(500).json({ error: 'No se pudo generar el Top Manual. Fallo en el endpoint fuente de productos.' });
    }

    if (products.length === 0) {
        return res.status(200).json({ error: 'No se pudo generar el Top Manual. Catálogo vacío o inaccesible.' });
    }

    // 1. Obtener y asegurar orden por margen DESC, tomar Top 5
    const top5 = products.sort((a, b) => (b.margin || 0) - (a.margin || 0)).slice(0, 5);

    if (!supabase) {
        console.error("Supabase client is null, no se puede insertar el Top");
        return res.status(500).json({ error: "No se pudo guardar el Top Manual en Supabase." });
    }

    try {
      // 2. Insertar en tabla tops
      const topName = `Top 5 manual – ${new Date().toISOString().split('T')[0]}`;
      const topPayload = {
           name: topName,
           description: "Top 5 por margen construido desde catálogo actual",
           type: "top5",
           category: null,
           status: "active"
      };

      const { data: topData, error: topError } = await supabase
        .from('tops')
        .insert([topPayload])
        .select('id')
        .single();

      if (topError) {
          console.error('create-top-manual: error insertando en tops', topError);
          return res.status(500).json({ error: "No se pudo guardar el Top Manual en Supabase." });
      }

      const topId = topData.id;

      // 3. Insertar en top_products
      const insertTopProducts = top5.map(p => ({
         top_id: topId,
         product_id: String(p.id || p.product_id || 'N/A'),
         name: String(p.name || 'Sin nombre'),
         category: p.category ? String(p.category) : null,
         margin: p.margin != null ? Number(p.margin) : null,
         stock: p.stock != null ? parseInt(p.stock, 10) : null,
         status: 'in_test'
      }));

      const { error: prodError } = await supabase
        .from('top_products')
        .insert(insertTopProducts);

      if (prodError) {
          console.error('create-top-manual: error insertando top_products', prodError);
          return res.status(500).json({ error: "No se pudo guardar el Top Manual en Supabase." });
      }

      // 4. Retornar éxito JSON
      return res.status(200).json({ top_id: topId, count_products: top5.length });
    } catch (dbCrash) {
      console.error("Crash fatal interactuando con Supabase BD:", dbCrash);
      return res.status(500).json({ error: "No se pudo guardar el Top Manual en Supabase." });
    }

  } catch (fatalError) {
    console.error("[TOP CREATOR GLOBAL ERROR]", fatalError);
    return res.status(500).json({ error: 'No se pudo guardar el Top Manual en Supabase.' });
  }
}
