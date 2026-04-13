import { dropeaQuery } from '../dropea_connector.js';

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

    res.json({
      success: true,
      message: `Orden ${result.data?.createOrder?.id || 'procesada'} sincronizada con Dropea.`,
      orderId: result.data?.createOrder?.id
    });
  } catch (e) {
    console.error('[Dropea Order Error]:', e.message);
    res.status(500).json({ success: false, error: 'Conexión Dropea rechazada: ' + e.message });
  }
}
