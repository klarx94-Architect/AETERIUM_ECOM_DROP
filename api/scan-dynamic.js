import { dropeaQuery } from '../dropea_connector.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: "Method Not Allowed" });
    }

    try {
        const { prompt } = req.body;
        console.log(`[DYNAMIC INTEL] Analizando prompt: "${prompt}"`);
        
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY no configurada en el servidor.");
        }

        let filters = { minStock: 0, minMargin: 0, keyword: "" };

        if (prompt && prompt.trim() !== "") {
            const systemPrompt = `
            Eres un analizador de lenguaje natural para e-commerce. 
            Extrae filtros JSON de la petición del usuario.
            Campos:
            - minStock (número): stock mínimo solicitado.
            - minMargin (número): margen mínimo solicitado.
            - keyword (string): palabra clave de búsqueda.

            Si el usuario dice "más de 15 de margen", minMargin es 15.
            Si dice "barbacoa", keyword es "barbacoa".
            Responde SOLO el JSON válido.
            `;

            // Llamada REST Directa para el filtrado especializado
            const model = "gemini-1.5-flash";
            const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;

            const geminiRes = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: `${systemPrompt}\n\nUsuario: "${prompt}"` }] }],
                    generationConfig: { responseMimeType: "application/json" }
                })
            });

            if (geminiRes.ok) {
                const resultJson = await geminiRes.json();
                const jsonText = resultJson.candidates?.[0]?.content?.parts?.[0]?.text;
                if (jsonText) {
                    try {
                        const parsed = JSON.parse(jsonText);
                        filters = { ...filters, ...parsed };
                    } catch (e) {
                        console.warn("[IA PARSE WARNING] No se pudo parsear JSON de filtros, usando valores por defecto.", jsonText);
                    }
                }
            }
        }

        console.log("[DYNAMIC INTEL] Filtros aplicados:", filters);

        // 2. Consulta a Dropea
        const gqlQuery = `
          query GetProducts($first: Int, $keyword: String) {
            products(first: $first, keyword: $keyword) {
              edges {
                node {
                  id
                  name
                  category { name }
                  cost
                  pvp
                  stock
                }
              }
            }
          }
        `;

        const dropeaData = await dropeaQuery(gqlQuery, { 
            first: 100, 
            keyword: filters.keyword || "" 
        });

        const allProducts = dropeaData?.data?.products?.edges?.map(e => e.node) || [];

        // 3. Filtrado Local (Post-GQL)
        const filteredProducts = allProducts.filter(p => {
            const margin = (p.pvp || 0) - (p.cost || 0);
            const stock = p.stock || 0;
            return margin >= (filters.minMargin || 0) && stock >= (filters.minStock || 0);
        });

        // 4. Formatear para el frontend
        const finalResults = filteredProducts.slice(0, 10).map(p => ({
            id: p.id,
            name: p.name,
            category: p.category?.name || "General",
            cost: p.cost,
            pvp: p.pvp,
            margin: (p.pvp - p.cost).toFixed(2),
            stock: p.stock
        }));

        return res.status(200).json({
            success: true,
            data: finalResults,
            filtersApplied: filters
        });

    } catch (error) {
        console.error("[SCAN DYNAMIC ERROR]", error);
        return res.status(500).json({ 
            success: false, 
            error: "Error táctico en el escaneo dinámico: " + error.message 
        });
    }
}
