import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// Inicialización de Supabase con fallback flexible
let supabase = null;
try {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
} catch (err) {
  console.error("Error top-level init Supabase en /api/strategy-for-top:", err);
}

// Configuración de Gemini con validación estable en v1
const apiKey = process.env.GEMINI_API_KEY;
// Usamos v1 para compatibilidad con Gemini 3 Flash
const genAI = apiKey ? new GoogleGenerativeAI(apiKey, { apiVersion: "v1" }) : null;
// Forzamos el uso de Gemini 3 Flash
const modelText = genAI ? genAI.getGenerativeModel({ model: "gemini-3-flash" }) : null;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: "Method Not Allowed" });
    }

    try {
        const { top_id } = req.body;
        if (!top_id) {
            return res.status(400).json({ success: false, error: 'top_id es requerido' });
        }

        if (!apiKey || !modelText) {
            console.error('[IA CONFIG ERROR] GEMINI_API_KEY is missing or SDK failed to init.');
            return res.status(500).json({ success: false, error: 'Configuración IA incompleta: falta la API key de Gemini o error de inicialización.' });
        }

        if (!supabase) {
            console.error('[DB CONFIG ERROR] Supabase credentials missing (SUPABASE_URL/ANON_KEY).');
            return res.status(500).json({ success: false, error: "Supabase no está configurado en el servidor." });
        }

        // 1. Obtener Metadatos del Top
        const { data: top, error: topError } = await supabase
            .from('tops')
            .select('*')
            .eq('id', top_id)
            .maybeSingle();

        if (topError || !top) {
            console.error("[IA ERROR] Top no encontrado:", top_id, topError);
            return res.status(404).json({ success: false, error: 'Top no encontrado en la base de datos.' });
        }

        // 2. Obtener Productos del Top
        const { data: products, error: prodError } = await supabase
            .from('top_products')
            .select('*')
            .eq('top_id', top_id);

        if (prodError) {
            console.error("[IA ERROR] Error obteniendo productos:", prodError);
            return res.status(500).json({ success: false, error: 'Error al recuperar productos del Top para la IA.' });
        }

        // 3. Construir el Briefing para Gemini
        const briefing = {
            top: { 
                name: top.name, 
                type: top.type, 
                created_at: top.created_at,
                description: top.description
            },
            products: products.map(p => ({
                name: p.name,
                category: p.category,
                margin: p.margin,
                stock: p.stock
            }))
        };

        const prompt = `
Eres el Comandante de Inteligencia Táctica de AETERIUM. 
Has recibido un lote estratégico de ${products.length} productos de alto margen para una operación de Dropshipping.

CONTEXTO DE LA OPERACIÓN:
- Nombre: "${briefing.top.name}"
- Tipo: ${briefing.top.type}
- Fecha de Generación: ${briefing.top.created_at}

NODOS DE VALOR (PRODUCTOS):
${briefing.products.map((p, i) => `${i+1}. ${p.name} (Cat: ${p.category || 'N/A'}) - Margen: €${p.margin} - Stock: ${p.stock}`).join('\n')}

TU MISIÓN:
Genera una estrategia de marketing agresiva y segmentada para este lote.
Devuelve EXCELSIOR MARKDOWN con estas secciones:

## 🏹 Objetivos de Guerrilla
Define 3 objetivos tácticos específicos para este lote de productos basándote en su potencial de margen.

## 🛰️ Canales de Despliegue
Sugiere los mejores canales (TikTok Organic, FB Ads, WhatsApp Broadcaster) según las categorías de los productos detectados.

## 💡 Tácticas de Venta por Nodo
Dada la lista anterior, selecciona los 2 productos con mayor potencial y escribe un ángulo de venta psicológico para cada uno.

## 📅 Roadmap de Ejecución (72h)
Pasos críticos para lanzar este Top al mercado.

Usa un tono profesional, militarizado pero pragmático. Cero relleno. Solo efectividad comercial.
        `;

        // 4. Llamada a Gemini
        const result = await modelText.generateContent(prompt);
        const strategyText = result.response.text();

        // 5. Retornar Respuesta
        return res.status(200).json({ success: true, strategy: strategyText });

    } catch (e) {
        console.error("[IA GLOBAL ERROR]", e);
        return res.status(500).json({ success: false, error: 'Fallo crítico en generación IA: ' + (e.message || 'Error desconocido') });
    }
}
