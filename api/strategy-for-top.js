import { createClient } from '@supabase/supabase-js';

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
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY;

        if (!apiKey) return res.status(500).json({ success: false, error: 'Falta Gemini API Key.' });
        if (!supabaseUrl || !supabaseKey) return res.status(500).json({ success: false, error: 'Configuración Supabase incompleta.' });

        // Inicialización INTERNA
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Obtener Metadatos del Top y Productos
        const { data: top, error: topError } = await supabase
            .from('tops')
            .select('*, top_products(*)')
            .eq('id', top_id)
            .maybeSingle();

        if (topError || !top) {
            return res.status(404).json({ success: false, error: 'Top no encontrado.' });
        }

        const products = top.top_products || [];

        const prompt = `Estrategia de marketing para el Top: ${top.name}. Productos: ${products.map(p => p.name).join(', ')}`;

        // 2. Llamada Directa REST (Gemini 3 Flash)
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
            throw new Error(`Gemini Error: ${geminiRes.status} - ${errorBody}`);
        }

        const resultJson = await geminiRes.json();
        const strategyText = resultJson.candidates?.[0]?.content?.parts?.[0]?.text || "No se pudo generar estrategia.";

        return res.status(200).json({ success: true, strategy: strategyText });

    } catch (e) {
        console.error("[IA ERROR]", e);
        return res.status(500).json({ success: false, error: e.message });
    }
}
