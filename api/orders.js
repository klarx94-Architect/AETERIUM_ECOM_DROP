import { dropeaQuery } from '../dropea_connector.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { name, address, phone, payment, productId } = req.body;
    console.log(`[DROPEA SYNC] Intentando crear orden real para ID ${productId}`);

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
            console.error("[Dropea Sync Reject GraphQL]:", JSON.stringify(result.errors));
            return res.status(400).json({ success: false, error: result.errors[0].message });
        }

        res.status(200).json({ success: true, message: `Orden ${result.data?.createOrder?.id || 'procesada'} sincronizada.` });
    } catch(e) {
        console.error("[Dropea Sync Error Red]:", e.message);
        res.status(500).json({ success: false, error: "Conexión a Dropea rechazada: " + e.message });
    }
}
