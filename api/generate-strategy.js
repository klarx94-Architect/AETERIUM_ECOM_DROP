import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { name, category, cost, pvp, margin } = req.body;
    if (!name) return res.status(400).json({ error: 'Producto requerido' });

    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Eres el agente AETERIUM de inteligencia comercial.
Arma una estrategia de Guerrilla Dropshipping para este producto real de España:
"${name}" - ${category} (Costo: €${cost} | PVP: €${pvp} | Margen: €${margin})

Devuelve MARKDOWN con estas secciones:
## 📊 Resumen Estratégico
Diagnóstico de venta en 3 líneas directas. Temporada actual: Primavera/Verano España.

## 📝 Copies Guerrilla (Marketplace & WhatsApp)
3 variaciones de post pareciendo humano real que limpia su garaje o compró dos por error. Cero estética de tienda. Casual y emocional.

## 📸 Prompts para Imágenes IA (Midjourney/Flux)
3 prompts fotorrealistas en INGLÉS para generar imágenes lifestyle del producto.`;

    const result = await model.generateContent(prompt);
    res.json({ strategy: result.response.text() });
  } catch (e) {
    console.error('[ERROR STRATEGY]', e.message);
    res.status(500).json({ error: 'Fallo IA: ' + e.message });
  }
}
