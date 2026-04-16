export default async function handler(req, res) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        
        // 1. Listar Nombres de Variables de Entorno (SIN VALORES por seguridad)
        const envKeys = Object.keys(process.env).sort();

        // 2. Consultar Modelos Disponibles desde Google (Source of Truth)
        let modelList = [];
        if (apiKey) {
            const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
            const gRes = await fetch(url);
            const gData = await gRes.json();
            modelList = gData.models ? gData.models.map(m => m.name) : gData;
        }

        return res.status(200).json({
            success: true,
            timestamp: new Date().toISOString(),
            diagnostics: {
                hasApiKey: !!apiKey,
                env_keys: envKeys,
                available_models: modelList
            }
        });
    } catch (e) {
        return res.status(500).json({ success: false, error: e.message });
    }
}
