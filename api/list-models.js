export default async function handler(req, res) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: "Missing GEMINI_API_KEY" });

        const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        return res.status(200).json({ 
            success: true, 
            apiKeyConfigured: !!apiKey,
            models: data.models ? data.models.map(m => ({
                name: m.name,
                displayName: m.displayName,
                supportedGenerationMethods: m.supportedGenerationMethods
            })) : data
        });
    } catch (e) {
        return res.status(500).json({ success: false, error: e.message });
    }
}
