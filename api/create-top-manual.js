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
  // Enveloping whole handler to prevent unhandled explosions
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'POST') {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    if (!supabase || !process.env.SUPABASE_URL) {
        throw new Error("Supabase is not configured.");
    }

    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host || req.headers['x-vercel-deployment-url'];
    
    if (!host) {
        throw new Error("No se pudo resolver el host para la llamada interna.");
    }

    const apiUrl = `${protocol}://${host}/api/products`;
    console.log("[TOP CREATOR] Lanzando petición a:", apiUrl);

    let products = [];
    try {
      const productReq = await fetch(apiUrl);
      if (!productReq.ok) {
          console.error(`create-top-manual: /api/products respondió ${productReq.status}`);
          throw new Error("Products endpoint failed");
      }
      
      const data = await productReq.json();
      products = Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('create-top-manual: error obteniendo productos', err.message);
      return res.status(500).json({ error: 'No se pudo generar el Top Manual. Fallo en el endpoint fuente de productos.' });
    }

    if (products.length === 0) {
        return res.status(200).json({ error: 'No hay productos suficientes para Top Manual, el catálogo está vacío.' });
    }

    // 1. Obtener y asegurar orden por margen DESC, tomar Top 5
    const top5 = products.sort((a, b) => (b.margin || 0) - (a.margin || 0)).slice(0, 5);

    // 2. Insertar en tabla tops
    const topName = `Top 5 manual – ${new Date().toISOString().split('T')[0]}`;
    const { data: topData, error: topError } = await supabase
      .from('tops')
      .insert([{
         name: topName,
         description: "Top 5 por margen construido desde catálogo actual",
         type: "top5"
      }])
      .select('id')
      .single();

    if (topError) throw new Error("Error insertando el Top: " + topError.message);

    const topId = topData.id;

    // 3. Insertar en top_products
    const insertTopProducts = top5.map(p => ({
       top_id: topId,
       product_id: String(p.id),
       name: p.name,
       category: p.category || '',
       margin: parseFloat(p.margin || 0),
       stock: parseInt(p.stock || 0),
       status: 'in_test'
    }));

    const { error: prodError } = await supabase
      .from('top_products')
      .insert(insertTopProducts);

    if (prodError) throw new Error("Error vinculando productos al top: " + prodError.message);

    // 4. Retornar éxito JSON
    return res.status(200).json({ top_id: topId, count_products: top5.length });

  } catch (error) {
    console.error("[TOP CREATOR GLOBAL ERROR]", error.message);
    return res.status(500).json({ error: error.message || "Error interno del servidor" });
  }
}
