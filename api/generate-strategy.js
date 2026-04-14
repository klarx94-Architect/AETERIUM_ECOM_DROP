import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const modelText = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
        const { name, category, cost, pvp, margin } = req.body;
        console.log(`[STRATEGY AI] Generando reporte para: ${name}`);

        const prompt = `
Eres el agente AETERIUM de inteligencia comercial. 
Arma una estrategia de Guerrilla Dropshipping para este producto real de España:
"${name}" - ${category} (Costo: €${cost} | PVP: €${pvp} | Margen: €${margin})

Devuelve EXCELSIOR MARKDOWN con estas secciones:
## 📊 Resumen Estratégico (Primavera/Verano)
Diagnóstico de venta en 3 líneas directas.

## 📝 Copies Guerrilla (Marketplace & WhatsApp)
Escribe 3 variaciones de post pareciendo un humano real que limpia su garaje o compró dos por error. Cero estética de tienda. Casual y emocional.

## 📸 Prompts para NanoBanana (Midjourney/Flux)
Escribe 3 prompts fotorrealistas en INGLÉS para generar imágenes lifestyle. Ej: "iPhone 14 flash photo, folded barbecue resting on suburban messy grass, golden hour..."
        `;

        const result = await modelText.generateContent(prompt);
        const strategyText = result.response.text();

        // Persistencia en Supabase
        if (supabase && process.env.SUPABASE_URL) {
            await supabase.from('scans').insert([{
                product_name: name,
                analysis: strategyText
            }]);
        }

        res.status(200).json({ strategy: strategyText });
    } catch(e) {
        console.error("[ERROR STRATEGY]", e.message);
        res.status(500).json({ error: "Fallo generación IA: " + e.message });
    }
}
