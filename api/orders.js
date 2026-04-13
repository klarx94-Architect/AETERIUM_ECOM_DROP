import { dropeaQuery } from '../dropea_connector.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const ORDER_MUTATION = `
  mutation CreateDropshippingOrder($input: CreateOrderInput!) {
    createOrder(input: $input) { id total_price }
  }
`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, address, phone, payment, productId } = req.body;

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
      return res.status(400).json({ success: false, error: result.errors[0].message });
    }

    const orderId = result.data?.createOrder?.id;

    // Registrar orden en Supabase
    if (supabase && process.env.SUPABASE_URL) {
      await supabase.from('orders').insert({
        dropea_order_id: String(orderId || 'unknown'),
        customer_name: name,
        customer_phone: phone,
        shipping_address: address,
        payment_method: payment,
        product_id: String(productId),
        created_at: new Date().toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      message: `Orden ${orderId || 'procesada'} sincronizada con Dropea.`
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
}
