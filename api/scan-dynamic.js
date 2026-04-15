import { dropeaQuery } from '../dropea_connector.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "", { apiVersion: "v1" });
const modelFilter = genAI.getGenerativeModel({ 
    model: "gemini-1.5-pro", 
    generationConfig: { responseMimeType: "application/json" } 
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: "Method Not Allowed" });
    }

    try {
        const { prompt } = req.body;
        console.log(`[DYNAMIC INTEL] Analizando prompt: "${prompt}"`);
        
        // 1. Configuración de IA con Gemini 3 Flash
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY no configurada en el servidor.");
        }

        let filters = { minStock: 0, minMargin: 0, keyword: "" };

        if (prompt && prompt.trim() !== "") {
            const aiPrompt = `
            Extrae filtros técnicos del texto: "${prompt}".
            Retorna UNICAMENTE JSON con estos campos numéricos y cadena vacía por defecto:
            { "minStock": numero, "minMargin": numero, "keyword": "string descriptivo o vacio" }
            `;
            const aiResponse = await modelFilter.generateContent(aiPrompt);
            const rawText = aiResponse.response.text();
            try {
                filters = JSON.parse(rawText.replace(/```(json)?|```/g, "").trim());
            } catch (jsonErr) {
                console.warn("[SCANNER IA] Error parseando filtros IA, usando por defecto:", jsonErr.message);
            }
        }

        // 2. Consulta a Dropea
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

        // 3. Aplicar Filtros
        if (filters.minStock > 0) items = items.filter(p => p.stock >= filters.minStock);
        if (filters.minMargin > 0) items = items.filter(p => p.margin >= filters.minMargin);
        if (filters.keyword && filters.keyword.length > 2) {
            const kw = filters.keyword.toLowerCase();
            items = items.filter(p => p.name.toLowerCase().includes(kw) || p.category.toLowerCase().includes(kw));
        }

        items.sort((a, b) => b.margin - a.margin);
        const finalResults = items.slice(0, 50);

        // 4. Registro en Supabase
        if (supabase && process.env.SUPABASE_URL && prompt && finalResults.length > 0) {
            try {
                await supabase.from('scans').insert([{
                    product_name: `Búsqueda: ${prompt}`,
                    analysis: `Filtros Aplicados: Stock > ${filters.minStock}, Margen > ${filters.minMargin}, Keyword: ${filters.keyword}. Encontrados: ${finalResults.length}`,
                }]);
            } catch (supaErr) {
                console.error("[SCANNER SUPABASE] Error persistiendo scan:", supaErr.message);
            }
        }

        // 5. Respuesta Estandarizada
        res.status(200).json({ success: true, data: finalResults }); 

    } catch (e) {
        console.error("[ERROR SCANNER] ", e.message);
        res.status(500).json({ success: false, error: "Fallo en el escaneo dinámico: " + e.message });
    }
}
