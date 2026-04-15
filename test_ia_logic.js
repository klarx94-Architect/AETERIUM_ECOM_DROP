import handler from './api/strategy-for-top.js';

async function test() {
    console.log("--- INICIANDO TEST INTERNO DE /api/strategy-for-top ---");
    
    // Simulación de objetos req/res de Vercel/Express
    const req = {
        method: 'POST',
        body: { top_id: 'test-uuid' } 
    };
    
    const res = {
        status: (code) => {
            console.log(`Status Code: ${code}`);
            return {
                json: (data) => {
                    console.log("Response JSON:", JSON.stringify(data, null, 2));
                }
            };
        }
    };

    try {
        console.log("Ejecutando handler...");
        await handler(req, res);
    } catch (err) {
        console.error("FALLO CRÍTICO EN EL TEST:", err);
    }
}

test();
