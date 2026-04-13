import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const modelText = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, category, cost, pvp, margin, id } = req.body;

  try {
    const prompt = `Eres el agente AETERIUM de inteligencia comercial.
Arma una estrategia de Guerrilla Dropshipping para este producto real de España:
"${name}" - ${category} (Costo: €${cost} | PVP: €${pvp} | Margen: €${margin})

Devuelve MARKDOWN con estas secciones:
## Resumen Estratégico (Primavera/Verano)
Diagnóstico en 3 líneas directas.

## Copies Guerrilla (Marketplace & WhatsApp)
3 variaciones de post pareciendo un humano real que limpia su garaje. Casual y emocional.

## Prompts para IA de imágenes (Midjourney/Flux)
3 prompts fotorrealistas en INGLÉS para imágenes lifestyle.

## Zonas Prioritarias España
Lista las 5 ciudades donde este producto tiene más probabilidad de venta rápida y por qué.`;

    const result = await modelText.generateContent(prompt);
    const strategy = result.response.text();

    // Guardar estrategia generada en Supabase
    if (supabase && process.env.SUPABASE_URL && id) {
      await supabase.from('strategies').insert({
        dropea_id: String(id),
        product_name: name,
        strategy_md: strategy,
        created_at: new Date().toISOString()
      });
    }

    return res.status(200).json({ strategy });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
