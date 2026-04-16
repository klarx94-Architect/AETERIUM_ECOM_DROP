// BUILD TRIGGER: 2026-04-16T00:43Z - Verified Model Resolution (Gemini 2.5 Flash)
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: "Method Not Allowed" });
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("Falta Gemini API Key.");

        const { name, category, cost, pvp, margin } = req.body;
        console.log(`[STRATEGY AI] Generando reporte para: ${name}`);

        const prompt = `Reporte estratégico para: ${name}. Categoría: ${category}. Margen: ${margin}`;

        // Llamada Directa REST (Gemini 2.5 Flash - Verified Stable 2026)
        const model = "gemini-2.5-flash";
        const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;

        const geminiRes = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!geminiRes.ok) throw new Error(`Gemini Error: ${geminiRes.status}`);

        const resultJson = await geminiRes.json();
        const strategy = resultJson.candidates?.[0]?.content?.parts?.[0]?.text || "No se pudo generar la estrategia.";

        return res.status(200).json({ success: true, strategy });

    } catch (error) {
        console.error("Error generate-strategy:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
