import express from 'express';
import cors from 'cors';
import fs from 'fs';
import { dropeaQuery } from './dropea_connector.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_KEY = process.env.GEMINI_API_KEY || "AIzaSyCzYnu00AoYyXVRi7-0Lewusz4s2yDIJCY";
const genAI = new GoogleGenerativeAI(GEMINI_KEY);
const modelFilter = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { responseMimeType: "application/json" } });
const modelText = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const app = express();
app.use(cors());
app.use(express.static('public'));
app.use(express.json());

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
    margin: p.pvpr - p.cost_price,
    category: p.category
  }));
}

// 0. CARGA INICIAL sin filtros
app.get('/api/products', async (req, res) => {
  try {
    const result = await dropeaQuery(CATALOG_QUERY, { limit: 100 });
    if (result.errors) throw new Error(result.errors[0].message);
    let items = mapProducts(result.data?.products?.data || []);
    items.sort((a, b) => b.margin - a.margin);
    res.json(items.slice(0, 50));
  } catch (e) {
    console.error('[ERROR /api/products]', e.message);
    if (fs.existsSync('top5_guerrilla.json')) {
      res.json(JSON.parse(fs.readFileSync('top5_guerrilla.json', 'utf8')));
    } else {
      res.status(500).json({ error: e.message });
    }
  }
});

// 1. DYNAMIC SCAN: prompt humano -> filtros
app.post('/api/scan-dynamic', async (req, res) => {
    try {
        const { prompt } = req.body;
        let filters = { minStock: 0, minMargin: 0, keyword: "" };
        if (prompt && prompt.trim() !== "") {
            const aiPrompt = `Extrae filtros tecnicos del texto: "${prompt}". Retorna UNICAMENTE JSON: { "minStock": numero, "minMargin": numero, "keyword": "string o vacio" }`;
            const aiResponse = await modelFilter.generateContent(aiPrompt);
            filters = JSON.parse(aiResponse.response.text().replace(/```(json)?|```/g, "").trim());
        }
        const result = await dropeaQuery(CATALOG_QUERY, { limit: 100 });
        if (result.errors) throw new Error(result.errors[0].message);
        let items = mapProducts(result.data?.products?.data || []);
        if (filters.minStock > 0) items = items.filter(p => p.stock >= filters.minStock);
        if (filters.minMargin > 0) items = items.filter(p => p.margin >= filters.minMargin);
        if (filters.keyword?.length > 2) {
            const kw = filters.keyword.toLowerCase();
            items = items.filter(p => p.name.toLowerCase().includes(kw) || p.category.toLowerCase().includes(kw));
        }
        items.sort((a, b) => b.margin - a.margin);
        res.json(items.slice(0, 50));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 2. STRATEGY GENERATOR
app.post('/api/generate-strategy', async (req, res) => {
    try {
        const { name, category, cost, pvp, margin } = req.body;
        const prompt = `Eres el agente AETERIUM de inteligencia comercial.
Arma una estrategia de Guerrilla Dropshipping para este producto real de Espana:
"${name}" - ${category} (Costo: EUR${cost} | PVP: EUR${pvp} | Margen: EUR${margin})

Devuelve MARKDOWN con estas secciones:
## Resumen Estrategico (Primavera/Verano)
Diagnostico en 3 lineas directas.

## Copies Guerrilla (Marketplace & WhatsApp)
3 variaciones de post pareciendo un humano real que limpia su garaje. Casual y emocional.

## Prompts para IA de imagenes (Midjourney/Flux)
3 prompts fotorrealistas en INGLES para imagenes lifestyle.`;
        const result = await modelText.generateContent(prompt);
        res.json({ strategy: result.response.text() });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

// 3. DROPEA ORDER MUTATION
app.post('/api/orders', async (req, res) => {
    const { name, address, phone, payment, productId } = req.body;
    const ORDER_MUTATION = `mutation CreateDropshippingOrder($input: CreateOrderInput!) {
      createOrder(input: $input) { id total_price }
    }`;
    try {
        const result = await dropeaQuery(ORDER_MUTATION, {
            input: { customer_name: name, shipping_address: address, customer_phone: phone,
                payment_method: payment, items: [{ product_id: parseInt(productId), quantity: 1 }] }
        });
        if (result.errors) return res.status(400).json({ success: false, error: result.errors[0].message });
        res.json({ success: true, message: `Orden ${result.data?.createOrder?.id || 'procesada'} sincronizada.` });
    } catch(e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.get('/api/guerrilla-intel', (req, res) => {
    try {
        res.json(fs.existsSync('top5_guerrilla.json')
            ? JSON.parse(fs.readFileSync('top5_guerrilla.json', 'utf8'))
            : []);
    } catch(e) { res.status(500).json({error: e.message}); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[AETERIUM ENGINE] Corriendo en puerto ${PORT}`));
