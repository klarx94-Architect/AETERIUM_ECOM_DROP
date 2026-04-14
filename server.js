// ============================================================
// AETERIUM ENGINE — SERVIDOR LOCAL DE DESARROLLO
// ============================================================
// ESTE ARCHIVO ES SOLO PARA USO LOCAL EN TU MÁQUINA.
// EN VERCEL, TODAS LAS RUTAS /api/* ESTÁN SERVIDAS POR LAS
// FUNCIONES SERVERLESS DE LA CARPETA /api/
// NUNCA MODIFICAR ESTE ARCHIVO PARA PRODUCCIÓN.
// ============================================================

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import { dropeaQuery } from './dropea_connector.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Clave desde variable de entorno — NUNCA hardcodeada
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const modelFilter = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { responseMimeType: 'application/json' } });
const modelText = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

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
    margin: +(p.pvpr - p.cost_price).toFixed(2),
    category: p.category
  }));
}

app.get('/api/products', async (req, res) => {
  try {
    const result = await dropeaQuery(CATALOG_QUERY, { limit: 100 });
    if (result.errors) throw new Error(result.errors[0].message);
    let items = mapProducts(result.data?.products?.data || []);
    items.sort((a, b) => b.margin - a.margin);
    res.json(items.slice(0, 50));
  } catch (e) {
    console.error('[ERROR /api/products LOCAL]', e.message);
    res.status(500).json({ error: 'Error al cargar catálogo local.' });
  }
});

app.post('/api/scan-dynamic', async (req, res) => {
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
      items = items.filter(p => p.name.toLowerCase().includes(kw) || p.category.toLowerCase().includes(kw));
    }
    items.sort((a, b) => b.margin - a.margin);
    res.json(items.slice(0, 50));
  } catch (e) {
    console.error('[ERROR /api/scan-dynamic LOCAL]', e.message);
    res.status(500).json({ error: 'Error en el escaneo local.' });
  }
});

app.post('/api/generate-strategy', async (req, res) => {
  try {
    const { name, category, cost, pvp, margin } = req.body;
    const prompt = `Eres el agente AETERIUM de inteligencia comercial. Genera estrategia para: "${name}" - ${category} (Costo: €${cost} | PVP: €${pvp} | Margen: €${margin})`;
    const result = await modelText.generateContent(prompt);
    res.json({ strategy: result.response.text() });
  } catch(e) {
    console.error('[ERROR /api/generate-strategy LOCAL]', e.message);
    res.status(500).json({ error: 'Error generación IA local.' });
  }
});

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
    if (result.errors) return res.status(400).json({ success: false, error: 'Dropea rechazó la orden. Verifica los datos.' });
    res.json({ success: true, message: `Orden ${result.data?.createOrder?.id || 'procesada'} sincronizada.` });
  } catch(e) {
    console.error('[ERROR /api/orders LOCAL]', e.message);
    res.status(500).json({ success: false, error: 'Error de conexión local con Dropea.' });
  }
});

app.get('/api/guerrilla-intel', (req, res) => {
  try {
    res.json(fs.existsSync('top5_guerrilla.json')
      ? JSON.parse(fs.readFileSync('top5_guerrilla.json', 'utf8'))
      : []);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[AETERIUM ENGINE LOCAL] Puerto ${PORT}`));
