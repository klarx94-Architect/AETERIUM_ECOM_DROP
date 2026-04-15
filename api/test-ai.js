export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: "Method Not Allowed" });
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: "Missing API Key" });

        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const geminiRes = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Hola, responde OK si recibes esto." }] }]
            })
        });

        const data = await geminiRes.json();
        return res.status(200).json({ 
            success: true, 
            message: "REST connection verified", 
            ia_response: data.candidates?.[0]?.content?.parts?.[0]?.text 
        });

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
