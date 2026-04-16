export default async function handler(req, res) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: "Missing Key" });

        const model = "gemini-3-flash";
        const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;

        const geminiRes = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Respond only with the word 'ACTIVO' if you are Gemini 3 Flash." }] }]
            })
        });

        const resultJson = await geminiRes.json();
        return res.status(200).json({ 
            success: true, 
            status: "REST v1 Live",
            ia_response: resultJson.candidates?.[0]?.content?.parts?.[0]?.text || "No response"
        });
    } catch (e) {
        return res.status(500).json({ success: false, error: e.message });
    }
}
