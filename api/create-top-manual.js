import { createClient } from '@supabase/supabase-js';

let supabase = null;
try {
  if (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY) {
    supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
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
           name: topName.substring(0, 100), // Limitar longitud por seguridad
           description: "Top 5 por margen construido desde catálogo actual",
           type: "top5",
           category: "Estrategia Manual",
           status: "active"
      };

      const { data: topRows, error: topError } = await supabase
        .from('tops')
        .insert([topPayload])
        .select();

      if (topError || !topRows || topRows.length === 0) {
          console.error('[DATABASE] Error insertando registro maestro (tops):', topError);
          return res.status(500).json({ error: "No se pudo guardar el registro maestro del Top Manual." });
      }

      const topId = topRows[0].id;

      // 3. Insertar en top_products (detalle)
      const insertTopProducts = top5.map(p => {
         // Limpiar y asegurar tipos de datos estrictos
         const safeName = String(p.name || 'Sin nombre').substring(0, 255);
         const safeProductId = String(p.id || p.product_id || 'N/A').substring(0, 50);
         const safeMargin = (p.margin !== null && !isNaN(p.margin)) ? Number(p.margin) : 0;
         const safeStock = (p.stock !== null && !isNaN(p.stock)) ? parseInt(p.stock, 10) : 0;

         return {
            top_id: topId,
            product_id: safeProductId,
            name: safeName,
            category: p.category ? String(p.category).substring(0, 100) : null,
            margin: safeMargin,
            stock: safeStock,
            status: 'in_test'
         };
      });

      const { error: prodError } = await supabase
        .from('top_products')
        .insert(insertTopProducts);

      if (prodError) {
          console.error('[DATABASE] Error insertando detalle (top_products):', prodError);
          // Si falla el detalle, el registro maestro ya quedó creado. 
          // Retornamos error específico para diagnóstico.
          return res.status(500).json({ error: "Fallo al vincular productos al Top Manual (Detalle)." });
      }

      // 4. Retornar éxito JSON
      return res.status(200).json({ 
          top_id: topId, 
          count_products: top5.length,
          message: "Top Manual creado y vinculado exitosamente." 
      });
    } catch (dbCrash) {
      console.error("[DATABASE CRASH]", dbCrash);
      return res.status(500).json({ error: "Excepción fatal en la base de datos." });
    }

  } catch (fatalError) {
    console.error("[TOP CREATOR GLOBAL ERROR]", fatalError);
    return res.status(500).json({ error: 'No se pudo guardar el Top Manual en Supabase.' });
  }
}
