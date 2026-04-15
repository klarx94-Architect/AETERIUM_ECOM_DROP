const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://mqbarhsrcwqocpzkeplm.supabase.co',
  'sb_publishable_i7kKjnidRyoFppInsVfp2g_ZwhgmaTV'
);

async function run() {
  console.log("Intentando insertar top...");
  const topName = `Top 5 manual – test`;
  const { data: topData, error: topError } = await supabase
    .from('tops')
    .insert([{
       name: topName,
       description: "Top 5 test",
       type: "top5"
    }])
    .select('id')
    .single();

  if (topError) {
      console.error("Error insertando el Top en BD:");
      console.error(topError);
      return;
  }
  console.log("Top insertado:", topData);

  const topId = topData.id;
  const insertTopProducts = [
    {
       top_id: topId,
       product_id: "test1",
       name: "Test Product",
       category: "",
       margin: 10.5,
       stock: 10,
       status: 'in_test'
    }
  ];

  const { error: prodError } = await supabase
    .from('top_products')
    .insert(insertTopProducts);

  if (prodError) {
      console.error("Error vinculando productos al top en BD: ");
      console.error(prodError);
      return;
  }
  console.log("Productos insertados con exito.");
  
  // Clean up test
  await supabase.from('tops').delete().eq('id', topId);
}
run();
