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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo no permitido' });

  const { name, category, cost, pvp, margin, marginPct, stock, id } = req.body;

  // Validacion minima de campos requeridos
  if (!name || !pvp) {
    return res.status(400).json({ error: 'Datos de producto incompletos.' });
  }

  try {
    const prompt = `Eres el motor de inteligencia comercial del sistema AETERIUM.
Tu mision: generar una estrategia de venta organica para un revendedor profesional en Espana que opera en marketplaces (Wallapop, Milanuncios, Facebook Marketplace, grupos de WhatsApp locales).

PRODUCTO ANALIZADO:
Nombre: ${name}
Categoria: ${category || 'General'}
Precio de venta: ${pvp}€
Margen bruto: ${margin}€ (${marginPct || '?'}%)
Stock disponible: ${stock || '?'} unidades

CONTEXTO DE OPERACION (MUY IMPORTANTE):
- El revendedor NO es una tienda. Nunca lo parece.
- Cada anuncio representa UNA sola unidad disponible.
- Despues de cada venta, el anuncio se elimina y se marca como vendido, luego se vuelve a publicar.
- El comprador debe sentir que habla con una persona real, no con un negocio.
- Jamas mencionar stock masivo, almacen, tienda online ni dropshipping.
- El lenguaje debe sonar como alguien que tiene ese articulo en casa y lo vende porque le sobra, lo probó poco, o simplemente quiere deshacerse de él.
- Tono: directo, natural, cercano, cotidiano. Como escribiria cualquier persona en Espana.

GENERA EL SIGUIENTE INFORME EN MARKDOWN:

## Diagnostico rapido
En 3-4 lineas: por que este producto tiene potencial de venta rapida ahora mismo en Espana. Menciona estacionalidad si aplica. Sé directo, sin adornos.

## Textos de anuncio (Marketplace)
Escribe 3 versiones de descripcion para Wallapop / Milanuncios / Facebook Marketplace.
Cada una debe:
- Tener entre 5 y 7 frases.
- Sonar como una persona real vendiendo algo que tiene en casa.
- No mencionar nunca que tienes mas unidades, que eres vendedor habitual ni que tienes tienda.
- Incluir el precio de venta (${pvp}€) de forma natural, como si lo hubiera calculado el vendedor.
- Una frase sutil que genere interes sin presion: puede ser una experiencia personal, un uso concreto, o simplemente explicar por que ya no lo necesita.
- Separadas claramente con --- entre cada version.

## Texto para WhatsApp / grupos locales
Una version mas corta (3-4 frases) para enviar en grupos de vecinos, grupos locales o responder a un interesado.
Tono aun mas informal y directo. Sin precio fijo si no es necesario (puede poner "hablamos" al final).

## Prompts para imagenes IA (Midjourney / Flux / DALL-E)
Escribe 3 prompts en INGLES para generar fotos del producto que parezcan tomadas por un usuario real:
- Sin fondos blancos de estudio.
- Contexto cotidiano (mesa de casa, cocina, exterior urbano, etc.).
- Iluminacion natural, estilo foto de movil.
- Formato: una linea cada uno, listos para pegar directamente.

## Ciudades con mayor potencial inmediato
Lista 5 ciudades de Espana donde este producto tiene mas probabilidad de venta rapida en las proximas 48h. Una frase de justificacion por ciudad.`;

    const result = await modelText.generateContent(prompt);
    const strategy = result.response.text();

    // Log en Supabase (no bloquea la respuesta si falla)
    if (process.env.SUPABASE_URL && id) {
      supabase.from('strategies').insert({
        dropea_id: String(id),
        product_name: name,
        strategy_md: strategy,
        created_at: new Date().toISOString()
      }).then(() => {}).catch(err => console.error('[Supabase log error]', err.message));
    }

    return res.status(200).json({ strategy });
  } catch (e) {
    console.error('[GENERATE-STRATEGY ERROR]', e.message);
    return res.status(500).json({ error: 'No se pudo generar la estrategia. Intenta de nuevo.' });
  }
}
