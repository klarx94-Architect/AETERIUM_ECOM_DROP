import { dropeaQuery } from '../dropea_connector.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: "Method Not Allowed" });
    }

    try {
        const { prompt } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) throw new Error("GEMINI_API_KEY missing");

        // 1. DYNAMIC IMPORT para Supabase
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
            process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL, 
            process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
        );

        let filters = { minStock: 0, minMargin: 0, keyword: "" };

        if (prompt && prompt.trim() !== "") {
            // Gemini 3.1 Flash REST v1 (Verified for 2026)
            const model = "gemini-3.1-flash";
            const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;

            const geminiRes = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: `Extrae filtros JSON: minStock, minMargin, keyword de: "${prompt}". Responde solo JSON.` }] }],
                    generationConfig: { responseMimeType: "application/json" }
                })
            });

            if (geminiRes.ok) {
                const resultJson = await geminiRes.json();
                const jsonText = resultJson.candidates?.[0]?.content?.parts?.[0]?.text;
                if (jsonText) {
                    try {
                        filters = { ...filters, ...JSON.parse(jsonText) };
                    } catch (e) {
                        console.warn("IA Parse error", jsonText);
                    }
                }
            }
        }

        const gqlQuery = `query($first: Int, $keyword: String){products(first:$first, keyword:$keyword){edges{node{id name cost pvp stock category{name}}}}}`;
        const dropeaData = await dropeaQuery(gqlQuery, { first: 50, keyword: filters.keyword || "" });
        const allProducts = dropeaData?.data?.products?.edges?.map(e => e.node) || [];

        const finalResults = allProducts.filter(p => {
            const margin = (p.pvp || 0) - (p.cost || 0);
            return margin >= (filters.minMargin || 0) && (p.stock || 0) >= (filters.minStock || 0);
        }).slice(0, 10).map(p => ({
            id: p.id,
            name: p.name,
            category: p.category?.name || "General",
            cost: p.cost,
            pvp: p.pvp,
            margin: (p.pvp - p.cost).toFixed(2),
            stock: p.stock
        }));

        return res.status(200).json({ success: true, data: finalResults, filtersApplied: filters });

    } catch (error) {
        console.error("Scan error", error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
