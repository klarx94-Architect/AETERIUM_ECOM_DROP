const urlTop = "https://mqbarhsrcwqocpzkeplm.supabase.co/rest/v1/tops";
const urlProducts = "https://mqbarhsrcwqocpzkeplm.supabase.co/rest/v1/top_products";
const token = "sb_publishable_i7kKjnidRyoFppInsVfp2g_ZwhgmaTV";

async function testInsert() {
  // Insert top
  const resTop = await fetch(urlTop, {
    method: 'POST',
    headers: {
        'apikey': token,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    },
    body: JSON.stringify({
       name: "Top 5 manual – test REST",
       description: "Top 5 test",
       type: "top5"
    })
  });
  
  const textTop = await resTop.text();
  console.log("TOP Respuesta:", resTop.status, textTop);

  let topData;
  try { topData = JSON.parse(textTop); } catch(e) {}
  
  if (!resTop.ok || !topData) return;

  const topId = topData[0].id;
  
  // Insert products
  const resProd = await fetch(urlProducts, {
    method: 'POST',
    headers: {
        'apikey': token,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    },
    body: JSON.stringify([{
       top_id: topId,
       product_id: "test1",
       name: "Test Product",
       category: "",
       margin: 10.5,
       stock: 10,
       status: 'in_test'
    }])
  });
  
  console.log("PROD Respuesta:", resProd.status, await resProd.text());
}

testInsert();
