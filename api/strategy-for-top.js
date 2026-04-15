import { createClient } from '@supabase/supabase-js';

// Inicialización de Supabase con fallback flexible
let supabase = null;
try {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
} catch (err) {
  console.error("Error top-level init Supabase en /api/strategy-for-top:", err);
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Método no permitido' });
    }

    try {
        const { top_id } = req.body;
        if (!top_id) {
            return res.status(400).json({ success: false, error: 'ID del Top es requerido.' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ success: false, error: 'Configuración IA incompleta: falta la API key de Gemini.' });
        }

        if (!supabase) {
            console.error('[DB CONFIG ERROR] Supabase credentials missing (SUPABASE_URL/ANON_KEY).');
            return res.status(500).json({ success: false, error: "Supabase no está configurado en el servidor." });
        }

        // 1. Obtener Metadatos del Top y Productos
        // Usamos select con subquery para obtener todo de una vez
        const { data: top, error: topError } = await supabase
            .from('tops')
            .select('*, top_products(*)')
            .eq('id', top_id)
            .maybeSingle();

        if (topError || !top) {
            console.error("[IA ERROR] Top no encontrado:", top_id, topError);
            return res.status(404).json({ success: false, error: 'Top no encontrado en la base de datos.' });
        }

        const products = top.top_products || [];

        // 3. Construir el Briefing para Gemini
        const briefing = {
            top: { 
                name: top.name, 
                type: top.type, 
                created_at: top.created_at,
                description: top.description
            },
            products: products.map(p => ({
                name: p.name,
                category: p.category,
                margin: p.margin,
                stock: p.stock
            }))
        };

        const prompt = `
Eres el Comandante de Inteligencia Táctica de AETERIUM. 
Has recibido un lote estratégico de ${products.length} productos de alto margen para una operación de Dropshipping.

CONTEXTO DE LA OPERACIÓN:
- Nombre: "${briefing.top.name}"
- Tipo: ${briefing.top.type}
- Fecha de Generación: ${briefing.top.created_at}

NODOS DE VALOR (PRODUCTOS):
${briefing.products.map((p, i) => `${i+1}. ${p.name} (Cat: ${p.category || 'N/A'}) - Margen: €${p.margin} - Stock: ${p.stock}`).join('\n')}

TU MISIÓN:
Genera una estrategia de marketing agresiva y segmentada para este lote.
Devuelve EXCELSIOR MARKDOWN con estas secciones:

## 🏹 Objetivos de Guerrilla
Define 3 objetivos tácticos específicos para este lote de productos basándote en su potencial de margen.

## 🛰️ Canales de Despliegue
Sugiere los mejores canales (TikTok Organic, FB Ads, WhatsApp Broadcaster) según las categorías de los productos detectados.

## 💡 Tácticas de Venta por Nodo
Dada la lista anterior, selecciona los 2 productos con mayor potencial y escribe un ángulo de venta psicológico para cada uno.

## 📅 Roadmap de Ejecución (72h)
Pasos críticos para lanzar este Top al mercado.

Usa un tono profesional, militarizado pero pragmático. Cero relleno. Solo efectividad comercial.
        `;

        // 4. Llamada a Gemini vía REST (Eliminando dependencia del SDK)
        const model = "gemini-1.5-flash";
        const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;

        const geminiRes = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!geminiRes.ok) {
            const errorBody = await geminiRes.text();
            throw new Error(`Error API Gemini REST: ${geminiRes.status} - ${errorBody}`);
        }

        const resultJson = await geminiRes.json();
        const strategyText = resultJson.candidates?.[0]?.content?.parts?.[0]?.text || "No se pudo generar estrategia táctica.";

        // 5. Retornar Respuesta
        return res.status(200).json({ success: true, strategy: strategyText });

    } catch (e) {
        console.error("[IA GLOBAL ERROR]", e);
        return res.status(500).json({ success: false, error: 'Fallo crítico en generación IA: ' + (e.message || 'Error desconocido') });
    }
}
