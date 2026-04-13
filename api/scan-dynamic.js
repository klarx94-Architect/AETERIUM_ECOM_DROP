import { dropeaQuery } from '../dropea_connector.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { prompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelFilter = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    let filters = { minStock: 0, minMargin: 0, keyword: '' };

    if (prompt && prompt.trim() !== '') {
      const aiPrompt = `Extrae filtros técnicos del texto: "${prompt}".
Retorna UNICAMENTE JSON: { "minStock": numero, "minMargin": numero, "keyword": "string o vacio" }`;
      const aiResponse = await modelFilter.generateContent(aiPrompt);
      const rawText = aiResponse.response.text();
      filters = JSON.parse(rawText.replace(/```(json)?|```/g, '').trim());
    }

    const CATALOG_QUERY = `
      query GetMarketData($limit: Int) {
        products(limit: $limit) {
          data { id name stock_available cost_price pvpr category }
        }
      }
    `;
    const result = await dropeaQuery(CATALOG_QUERY, { limit: 200 });
    if (result.errors) throw new Error(result.errors[0].message);

    let items = (result.data?.products?.data || []).map(p => ({
      id: p.id,
      name: p.name,
      stock: p.stock_available,
      cost: p.cost_price,
      pvp: p.pvpr,
      margin: parseFloat((p.pvpr - p.cost_price).toFixed(2)),
      marginPct: parseFloat((((p.pvpr - p.cost_price) / p.pvpr) * 100).toFixed(1)),
      category: p.category
    }));

    if (filters.minStock > 0) items = items.filter(p => p.stock >= filters.minStock);
    if (filters.minMargin > 0) items = items.filter(p => p.margin >= filters.minMargin);
    if (filters.keyword && filters.keyword.length > 2) {
      const kw = filters.keyword.toLowerCase();
      items = items.filter(p =>
        p.name.toLowerCase().includes(kw) || (p.category || '').toLowerCase().includes(kw)
      );
    }

    items.sort((a, b) => b.margin - a.margin);
    res.json(items.slice(0, 50));
  } catch (e) {
    console.error('[ERROR SCANNER]', e.message);
    res.status(500).json({ error: 'Fallo en el escaneo: ' + e.message });
  }
}
