import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    if (!supabase || !process.env.SUPABASE_URL) {
       throw new Error("Supabase is not configured.");
    }

    // Usar llamada interna dinámica soportada en Vercel Edge/Lambdas
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host || req.headers['x-vercel-deployment-url'];
    
    if (!host) {
        throw new Error("No se pudo resolver el host para la llamada interna.");
    }

    const apiUrl = `${protocol}://${host}/api/products`;
    console.log("[TOP CREATOR] Lanzando petición a:", apiUrl);

    const productReq = await fetch(apiUrl);
    
    if (!productReq.ok) {
        throw new Error("No se pudo obtener el catálogo");
    }

    const products = await productReq.json();

    if (!Array.isArray(products) || products.length === 0) {
        throw new Error("Catálogo vacío o respuesta inválida.");
    }

    // 1. Obtener y asegurar orden por margen DESC, tomar Top 5
    const top5 = products.sort((a, b) => b.margin - a.margin).slice(0, 5);

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
       category: p.category,
       margin: parseFloat(p.margin),
       stock: parseInt(p.stock),
       status: 'in_test'
    }));

    const { error: prodError } = await supabase
      .from('top_products')
      .insert(insertTopProducts);

    if (prodError) throw new Error("Error vinculando productos al top: " + prodError.message);

    // 4. Retornar éxito
    return res.status(200).json({ top_id: topId, count_products: top5.length });

  } catch (error) {
    console.error("[TOP CREATOR ERROR]", error.message);
    return res.status(500).json({ error: error.message || "Error interno del servidor" });
  }
}
