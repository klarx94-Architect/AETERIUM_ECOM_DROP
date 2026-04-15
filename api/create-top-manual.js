import { createClient } from '@supabase/supabase-js';

let supabase = null;
try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
  } else {
    console.warn('create-top-manual: SUPABASE env vars missing, no se podrá insertar BD.');
  }
} catch (err) {
  console.error('create-top-manual: error instanciando Supabase', err.message);
  supabase = null;
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
      console.error('create-top-manual: error obteniendo productos', err.message);
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
      const { data: topData, error: topError } = await supabase
        .from('tops')
        .insert([{
           name: topName,
           description: "Top 5 por margen construido desde catálogo actual",
           type: "top5"
        }])
        .select('id')
        .single();

      if (topError) {
          console.error("Error insertando el Top en BD:", topError.message);
          return res.status(500).json({ error: "No se pudo guardar el Top Manual en Supabase." });
      }

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

      if (prodError) {
          console.error("Error vinculando productos al top en BD:", prodError.message);
          return res.status(500).json({ error: "No se pudo guardar el Top Manual en Supabase." });
      }

      // 4. Retornar éxito JSON
      return res.status(200).json({ top_id: topId, count_products: top5.length });
    } catch (dbCrash) {
      console.error("Crash fatal interactuando con Supabase BD:", dbCrash.message);
      return res.status(500).json({ error: "No se pudo guardar el Top Manual en Supabase." });
    }

  } catch (fatalError) {
    console.error("[TOP CREATOR GLOBAL ERROR]", fatalError.message);
    return res.status(500).json({ error: 'No se pudo generar el Top Manual. Error interno.' });
  }
}
