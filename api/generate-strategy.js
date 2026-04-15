import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: "Method Not Allowed" });
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ success: false, error: "Falta Gemini API Key." });
        }

        const { name, category, cost, pvp, margin } = req.body;
        console.log(`[STRATEGY AI] Generando reporte para: ${name}`);

        const prompt = `
        Genera un reporte estratégico de ventas para un producto de Dropshipping.
        
        PRODUCTO: ${name}
        CATEGORÍA: ${category}
        COSTO: ${cost}
        PVP: ${pvp}
        MARGEN: ${margin}

        El reporte debe incluir:
        - Análisis de viabilidad.
        - 3 Estrategias de marketing.
        - Público objetivo.
        - Copy sugerido para anuncio.
        
        Formato: Markdown.
        `;

        // Llamada Directa a Gemini vía REST (Gemini 3 Flash)
        const model = "gemini-3-flash";
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
        const strategy = resultJson.candidates?.[0]?.content?.parts?.[0]?.text || "No se pudo generar la estrategia.";

        return res.status(200).json({ success: true, strategy });

    } catch (error) {
        console.error("Error en generate-strategy IA:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
