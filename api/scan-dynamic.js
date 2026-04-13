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
    cost: p.cost_price,
    pvp: p.pvpr,
    margin: +(p.pvpr - p.cost_price).toFixed(2),
    category: p.category
  }));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { prompt } = req.body;
    let filters = { minStock: 0, minMargin: 0, keyword: '' };

    if (prompt && prompt.trim() !== '') {
      const aiPrompt = `Extrae filtros tecnicos del texto: "${prompt}". Retorna UNICAMENTE JSON: { "minStock": numero, "minMargin": numero, "keyword": "string o vacio" }`;
      const aiResponse = await modelFilter.generateContent(aiPrompt);
      filters = JSON.parse(aiResponse.response.text().replace(/```(json)?|```/g, '').trim());
    }

    const result = await dropeaQuery(CATALOG_QUERY, { limit: 100 });
    if (result.errors) throw new Error(result.errors[0].message);
    let items = mapProducts(result.data?.products?.data || []);

    if (filters.minStock > 0) items = items.filter(p => p.stock >= filters.minStock);
    if (filters.minMargin > 0) items = items.filter(p => p.margin >= filters.minMargin);
    if (filters.keyword?.length > 2) {
      const kw = filters.keyword.toLowerCase();
      items = items.filter(p =>
        p.name.toLowerCase().includes(kw) ||
        p.category.toLowerCase().includes(kw)
      );
    }

    items.sort((a, b) => b.margin - a.margin);
    return res.status(200).json(items.slice(0, 50));
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
