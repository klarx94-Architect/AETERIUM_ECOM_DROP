import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const genAI = new GoogleGenerativeAI("AIzaSyCzYnu00AoYyXVRi7-0Lewusz4s2yDIJCY");

async function generateIntelligenceReport() {
    console.log("[PRODUCT INTELLIGENCE CORE] Inicializando análisis de Barbacoa Plegable...");

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
Eres un agente experto en dropshipping y marketing de guerrilla. 
Analiza el producto: "Barbacoa Plegable de Acero Inoxidable ExelQ".

Devuelve el formato estrictamente en Markdown con 3 secciones claras:

# 📊 Análisis del Producto (Barbacoa Plegable)
Estadísticas estimadas, público objetivo primario, y el ángulo de venta agresivo pero casual para la temporada Primavera/Verano.

# 📝 Copies de Venta (Directiva Guerrilla)
Escribe 3 textos distintos para Facebook Marketplace y WhatsApp simulando repuestas reales. El enfoque debe ser que te sobra una barbacoa porque te compraste otra o te mudas. Que se sienta natural, humano, sin parecer una tienda oficial ni dropshipper. Uso de lenguaje casual y emojis justos.

# 📸 Prompts para Nano Banana 2
Proporciona 3 instrucciones milimétricas para generar imágenes fotorrealistas en Midjourney/Nano Banana 2.
Ejemplo de estilo: "Foto tomada con un iPhone 14, ligeramente desenfocada, luz cruda de atardecer, sobre césped descuidado, venta casual de segunda mano, fotorrealismo extremo, sin iluminación de estudio comercial".
    `;

    try {
        const result = await model.generateContent(prompt);
        const report = result.response.text();

        const outputPath = path.join(__dirname, 'Barbacoa_Intelligence_Report.md');
        fs.writeFileSync(outputPath, report, 'utf-8');
        console.log(`[PRODUCT INTELLIGENCE CORE] Reporte generado exitosamente: ${outputPath}`);

    } catch (e) {
        console.error("[ERROR CRÍTICO] Inteligencia fallida:", e.message);
    }
}

generateIntelligenceReport();
