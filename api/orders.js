import { dropeaQuery } from '../dropea_connector.js';

// ─── Supabase client (lazy init para no romper si las vars no están) ───────────
function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  // Usamos fetch nativo — sin dependencia extra
  return { url, key };
}

async function logOrderToSupabase(orderData) {
  const sb = getSupabase();
  if (!sb) {
    console.warn('[Supabase] Variables no configuradas — skipping log');
    return null;
  }
  try {
    const res = await fetch(`${sb.url}/rest/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': sb.key,
        'Authorization': `Bearer ${sb.key}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(orderData),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('[Supabase] Insert error:', JSON.stringify(data));
      return null;
    }
    return data[0] || data;
  } catch (e) {
    console.error('[Supabase] Fetch error:', e.message);
    return null;
  }
}

// ─── Handler principal ────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  res.setHeader('Access-Control-Allow-Origin', '*');

  const { name, address, phone, payment, productId } = req.body;
  if (!name || !address || !phone || !productId) {
    return res.status(400).json({ success: false, error: 'Campos obligatorios incompletos' });
  }

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
      console.error('[Dropea Order Reject]:', JSON.stringify(result.errors));
      return res.status(400).json({ success: false, error: result.errors[0].message });
    }

    const dropeaOrderId = result.data?.createOrder?.id;
    const dropeaTotal = result.data?.createOrder?.total_price;

    // ─── Registrar en Supabase (no bloqueante — si falla no rompe la orden) ─────
    const supabaseRecord = await logOrderToSupabase({
      dropea_order_id: dropeaOrderId,
      customer_name:   name,
      customer_phone:  phone,
      shipping_address: address,
      payment_method:  payment,
      product_id:      parseInt(productId),
      total_price:     dropeaTotal,
      status:          'confirmed',
      created_at:      new Date().toISOString(),
    });

    if (supabaseRecord) {
      console.log('[Supabase] Orden registrada ID:', supabaseRecord.id);
    }

    res.json({
      success: true,
      message: `Orden ${dropeaOrderId || 'procesada'} sincronizada con Dropea.`,
      orderId: dropeaOrderId,
      logged:  !!supabaseRecord,
    });
  } catch (e) {
    console.error('[Dropea Order Error]:', e.message);
    res.status(500).json({ success: false, error: 'Conexión Dropea rechazada: ' + e.message });
  }
}
