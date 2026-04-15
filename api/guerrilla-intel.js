import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
        if (!supabase || !process.env.SUPABASE_URL) {
            throw new Error("Supabase is not configured.");
        }

        const { data, error } = await supabase
            .from('scans')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (error) throw error;

        // Mapear al formato que espera el frontend
        const items = data.map(s => ({
            id: s.id,
            name: s.product_name,
            strategy: s.analysis,
            date: s.created_at
        }));

        res.status(200).json(items);
    } catch(e) {
        console.error("[ERROR INTEL SUPABASE] ", e.message);
        res.status(500).json({ error: e.message });
    }
}
