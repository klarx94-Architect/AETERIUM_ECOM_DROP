import { dropeaQuery } from '../dropea_connector.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const modelFilter = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash", 
    generationConfig: { responseMimeType: "application/json" } 
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

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
        res.status(200).json(items.slice(0, 50)); 

    } catch (e) {
        console.error("[ERROR SCANNER] ", e.message);
        res.status(500).json({ error: "Fallo en el escaneo dinámico: " + e.message });
    }
}
