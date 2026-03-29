import express from 'express';
import cors from 'cors';
import fs from 'fs';
import { dropeaQuery } from './dropea_connector.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI("AIzaSyCzYnu00AoYyXVRi7-0Lewusz4s2yDIJCY");
const modelFilter = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { responseMimeType: "application/json" } });
const modelText = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const app = express();
app.use(cors());
app.use(express.static('public'));
app.use(express.json());

// 1. DYNAMIC SCAN: Traduce prompt humano a filtros API
app.post('/api/scan-dynamic', async (req, res) => {
    try {
        const { prompt } = req.body;
        console.log(`[DYNAMIC INTEL] Analizando prompt: "${prompt}"`);
        
        let filters = { minStock: 0, minMargin: 0, keyword: "" };

        if (prompt && prompt.trim() !== "") {
            const aiPrompt = `
            Extrae filtros técnicos del texto: "${prompt}".
            Retorna UNICAMENTE JSON con estos campos numéricos y cadena vacía por defecto:
            { "minStock": numero, "minMargin": numero, "keyword": "string descriptivo o vacio" }
            `;
            const aiResponse = await modelFilter.generateContent(aiPrompt);
            const rawText = aiResponse.response.text();
            filters = JSON.parse(rawText.replace(/```(json)?|```/g, "").trim());
        }

        console.log(`[DYNAMIC INTEL] Filtros Aplicados:`, filters);

        // Fetch de Dropea
        const CATALOG_QUERY = `
          query GetMarketData($limit: Int) {
            products(limit: $limit) {
              data { id name stock_available cost_price pvpr category }
            }
          }
        `;
        const result = await dropeaQuery(CATALOG_QUERY, { limit: 100 });
        if (result.errors) throw new Error(result.errors[0].message);

        let items = result.data?.products?.data || [];
        
        items = items.map(p => ({
            id: p.id,
            name: p.name,
            stock: p.stock_available,
            cost: p.cost_price,
            pvp: p.pvpr,
            margin: p.pvpr - p.cost_price,
            category: p.category
        }));

        if (filters.minStock > 0) items = items.filter(p => p.stock >= filters.minStock);
        if (filters.minMargin > 0) items = items.filter(p => p.margin >= filters.minMargin);
        if (filters.keyword && filters.keyword.length > 2) {
            const kw = filters.keyword.toLowerCase();
            items = items.filter(p => p.name.toLowerCase().includes(kw) || p.category.toLowerCase().includes(kw));
        }

        items.sort((a, b) => b.margin - a.margin);
        res.json(items.slice(0, 50)); 

    } catch (e) {
        console.error("[ERROR SCANNER] ", e.message);
        res.status(500).json({ error: "Fallo en el escaneo dinámico. Error: " + e.message });
    }
});

// 2. STRATEGY GENERATOR
app.post('/api/generate-strategy', async (req, res) => {
    try {
        const { name, category, cost, pvp, margin } = req.body;
        console.log(`[STRATEGY AI] Generando reporte para: ${name}`);

        const prompt = `
Eres el agente AETERIUM de inteligencia comercial. 
Arma una estrategia de Guerrilla Dropshipping para este producto real de España:
"${name}" - ${category} (Costo: €${cost} | PVP: €${pvp} | Margen: €${margin})

Devuelve EXCELSIOR MARKDOWN con estas secciones:
## 📊 Resumen Estratégico (Primavera/Verano)
Diagnóstico de venta en 3 líneas directas.

## 📝 Copies Guerrilla (Marketplace & WhatsApp)
Escribe 3 variaciones de post pareciendo un humano real que limpia su garaje o compró dos por error. Cero estética de tienda. Casual y emocional.

## 📸 Prompts para NanoBanana (Midjourney/Flux)
Escribe 3 prompts fotorrealistas en INGLÉS para generar imágenes lifestyle. Ej: "iPhone 14 flash photo, folded barbecue resting on suburban messy grass, golden hour..."
        `;

        const result = await modelText.generateContent(prompt);
        res.json({ strategy: result.response.text() });
    } catch(e) {
        console.error("[ERROR STRATEGY]", e.message);
        res.status(500).json({ error: "Fallo generación IA: " + e.message });
    }
});

// 3. DROPEA SYNC MUTATION REAL
app.post('/api/orders', async (req, res) => {
    const { name, address, phone, payment, productId } = req.body;
    console.log(`[DROPEA SYNC] Intentando crear orden real para ID ${productId}`);

    const ORDER_MUTATION = `
        mutation CreateDropshippingOrder($input: CreateOrderInput!) {
          createOrder(input: $input) {
            id
            total_price
          }
        }
    `;
    
    try {
        const result = await dropeaQuery(ORDER_MUTATION, { 
            input: { 
                customer_name: name, 
                shipping_address: address, 
                customer_phone: phone, 
                payment_method: payment, 
                items: [{ product_id: parseInt(productId), quantity: 1 }] 
            } 
        });

        if (result.errors) {
            console.error("[Dropea Sync Reject GraphQL]:", JSON.stringify(result.errors));
            return res.status(400).json({ success: false, error: result.errors[0].message });
        }

        res.json({ success: true, message: `Orden ${result.data?.createOrder?.id || 'procesada'} sincronizada.` });
    } catch(e) {
        console.error("[Dropea Sync Error Red]:", e.message);
        res.status(500).json({ success: false, error: "Conexión a Dropea rechazada: " + e.message });
    }
});

app.get('/api/guerrilla-intel', (req, res) => {
    try {
        if (fs.existsSync('top5_guerrilla.json')) {
            res.json(JSON.parse(fs.readFileSync('top5_guerrilla.json', 'utf8')));
        } else {
            res.json([]);
        }
    } catch(e) {
        res.status(500).json({error: e.message});
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`[AETERIUM ENGINE] Node Server corriendo en puerto ${PORT}`);
});
