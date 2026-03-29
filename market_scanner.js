import { dropeaQuery } from './dropea_connector.js';
import { saveData } from './dashboard_data.js';

const CATALOG_QUERY = `
  query GetMarketData($limit: Int) {
    products(limit: $limit) {
      data {
        id
        name
        stock_available
        cost_price
        pvpr
        category
      }
    }
  }
`;

async function scanMarket() {
    console.log("[MARKET SCANNER] Ejecutando extracción de catálogo con Directiva de Guerrilla...");
    
    try {
        const result = await dropeaQuery(CATALOG_QUERY, { limit: 100 });

        if (result.errors) {
            console.error("[MARKET SCANNER] Error GraphQL:", JSON.stringify(result.errors, null, 2));
            return;
        }

        const items = result.data?.products?.data || [];
        console.log(`[MARKET SCANNER] ${items.length} productos obtenidos.`);
        
        // Directiva de Guerrilla
        // 1. Alto stock (>20)
        // 2. Buen margen de beneficio percibido (pvpr - cost_price)
        // 3. Resolución de problema: Nos basamos en categorías/nombre visualmente pero el algoritmo prioriza margen + stock
        const guerrillaPicks = items
            .filter(p => p.stock_available >= 20 && p.pvpr && p.cost_price)
            .map(p => ({
                id: p.id,
                name: p.name,
                stock: p.stock_available,
                cost: p.cost_price,
                pvp: p.pvpr,
                margin: p.pvpr - p.cost_price,
                category: p.category
            }))
            .sort((a, b) => b.margin - a.margin) // Mayor margen primero
            .slice(0, 5);

        console.log("\n[MARKET SCANNER] -> TOP 5 PRODUCTOS (Directiva de Guerrilla):");
        guerrillaPicks.forEach((p, i) => {
            console.log(` ${i+1}. [${p.category}] ${p.name}`);
            console.log(`    Stock: ${p.stock} ud | Costo: €${p.cost} | PVP: €${p.pvp} -> MARGEN: €${p.margin.toFixed(2)}`);
        });

        saveData('top5_guerrilla.json', guerrillaPicks);

    } catch (e) {
        console.error("[MARKET SCANNER] Error:", e.message);
    }
}

scanMarket();
