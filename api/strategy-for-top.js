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
            return res.status(500).json({ success: false, error: "Supabase no está configurado en el servidor." });
        }

        // 1. Obtener Metadatos del Top y Productos
        const { data: top, error: topError } = await supabase
            .from('tops')
            .select('*, top_products(*)')
            .eq('id', top_id)
            .maybeSingle();

        if (topError || !top) {
            return res.status(404).json({ success: false, error: 'Top no encontrado en la base de datos.' });
        }

        const products = top.top_products || [];

        // 2. Construir el Briefing para Gemini
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
Has recibido un lote estratégico de ${products.length} productos de alto margen.

CONTEXTO:
- Nombre: "${briefing.top.name}"
- Tipo: ${briefing.top.type}

NODOS DE VALOR:
${briefing.products.map((p, i) => `${i+1}. ${p.name} - Margen: €${p.margin}`).join('\n')}

TU MISIÓN:
Genera una estrategia de marketing agresiva en Markdown.
        `;

        // 3. Llamada Directa REST
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
            throw new Error(`Gemini API Error: ${geminiRes.status} - ${errorBody}`);
        }

        const resultJson = await geminiRes.json();
        const strategyText = resultJson.candidates?.[0]?.content?.parts?.[0]?.text || "No se pudo generar estrategia.";

        return res.status(200).json({ success: true, strategy: strategyText });

    } catch (e) {
        console.error("[IA ERROR]", e);
        return res.status(500).json({ success: false, error: e.message });
    }
}
