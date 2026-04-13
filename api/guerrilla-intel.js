import { dropeaQuery } from '../dropea_connector.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // Obtiene top productos por margen directamente desde Dropea (no filesystem)
    const CATALOG_QUERY = `
      query GetMarketData($limit: Int) {
        products(limit: $limit) {
          data { id name stock_available cost_price pvpr category }
        }
      }
    `;
    const result = await dropeaQuery(CATALOG_QUERY, { limit: 200 });
    if (result.errors) throw new Error(result.errors[0].message);

    const top5 = (result.data?.products?.data || [])
      .map(p => ({
        id: p.id,
        name: p.name,
        stock: p.stock_available,
        cost: p.cost_price,
        pvp: p.pvpr,
        margin: parseFloat((p.pvpr - p.cost_price).toFixed(2)),
        marginPct: parseFloat((((p.pvpr - p.cost_price) / p.pvpr) * 100).toFixed(1)),
        category: p.category
      }))
      .filter(p => p.stock > 10 && p.margin > 10)
      .sort((a, b) => b.margin - a.margin)
      .slice(0, 10);

    res.json(top5);
  } catch (e) {
    console.error('[ERROR GUERRILLA INTEL]', e.message);
    res.status(500).json({ error: e.message });
  }
}
