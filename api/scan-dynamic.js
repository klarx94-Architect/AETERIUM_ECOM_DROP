import { dropeaQuery } from '../dropea_connector.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const modelFilter = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: { responseMimeType: 'application/json' }
});

const CATALOG_QUERY = `
  query GetMarketData($limit: Int) {
    products(limit: $limit) {
      data { id name stock_available cost_price pvpr category }
    }
  }
`;

function mapProducts(raw) {
  return raw.map(p => ({
    id: p.id,
    name: p.name,
    stock: p.stock_available,
    cost: +(p.cost_price).toFixed(2),
    pvp: +(p.pvpr).toFixed(2),
    margin: +(p.pvpr - p.cost_price).toFixed(2),
    marginPct: p.pvpr > 0 ? +((p.pvpr - p.cost_price) / p.pvpr * 100).toFixed(1) : 0,
    category: p.category
  }));
}

/**
 * RANKING COMBINADO: margen absoluto + bonus por stock en punto medio
 * Filosofia: ni muy escaso (riesgo rotura) ni masivo (competencia alta).
 * Stock ideal: 10-80 unidades. Por encima de 80 el bonus deja de crecer.
 * Formula: score = margin * stockBonus
 * stockBonus = log2(min(stock, 80) + 1) / log2(81) → escala 0..1
 */
function scoreProduct(p) {
  if (p.stock < 3) return 0; // descartamos stock casi agotado
  const stockBonus = Math.log2(Math.min(p.stock, 80) + 1) / Math.log2(81);
  return p.margin * stockBonus;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo no permitido' });

  try {
    const { prompt } = req.body;
    let filters = { minStock: 0, minMargin: 0, keyword: '' };

    if (prompt && prompt.trim() !== '') {
      const aiPrompt = `Eres un asistente de filtrado de productos. Extrae los parametros de busqueda del siguiente texto: "${prompt}". Responde SOLO con JSON valido, sin explicaciones ni bloques de codigo: { "minStock": numero, "minMargin": numero, "keyword": "string o vacio" }`;
      const aiResponse = await modelFilter.generateContent(aiPrompt);
      const raw = aiResponse.response.text().replace(/```(json)?|```/g, '').trim();
      try {
        filters = JSON.parse(raw);
      } catch(_) {
        // Si Gemini devuelve algo raro, seguimos con filtros por defecto
        filters = { minStock: 0, minMargin: 0, keyword: '' };
      }
    }

    const result = await dropeaQuery(CATALOG_QUERY, { limit: 200 });
    if (result.errors) throw new Error(result.errors[0].message);
    let items = mapProducts(result.data?.products?.data || []);

    // Filtros base: siempre descartamos sin stock y sin margen
    items = items.filter(p => p.stock > 0 && p.margin > 0);

    // Filtros de busqueda del usuario
    if (filters.minStock > 0) items = items.filter(p => p.stock >= filters.minStock);
    if (filters.minMargin > 0) items = items.filter(p => p.margin >= filters.minMargin);
    if (filters.keyword && filters.keyword.length > 2) {
      const kw = filters.keyword.toLowerCase();
      items = items.filter(p =>
        p.name.toLowerCase().includes(kw) ||
        p.category.toLowerCase().includes(kw)
      );
    }

    // Ranking combinado margen + stock punto-medio
    items.sort((a, b) => scoreProduct(b) - scoreProduct(a));

    // Anadimos score visible para transparencia en la tabla
    items = items.map(p => ({ ...p, score: +scoreProduct(p).toFixed(2) }));

    return res.status(200).json(items.slice(0, 50));
  } catch (e) {
    console.error('[SCAN-DYNAMIC ERROR]', e.message);
    return res.status(500).json({ error: 'No se pudo completar el escaneo. Intenta de nuevo.' });
  }
}
