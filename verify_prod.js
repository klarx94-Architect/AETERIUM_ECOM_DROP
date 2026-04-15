const url = "https://aeterium-ecom-drop.vercel.app/api/create-top-manual";

async function testProduction() {
  console.log("Probando endpoint de producción: " + url);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Respuesta:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error en la petición:", err.message);
  }
}

testProduction();
