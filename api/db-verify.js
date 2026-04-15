import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!url || !key) {
        return res.status(200).json({ error: "Still missing VITE_ env vars", env: Object.keys(process.env).filter(k => k.includes('SUPABASE')) });
    }

    const supabase = createClient(url, key);
    
    try {
        const testTop = { name: "Diag Insert", type: "top5", status: "active" };
        const { data, error } = await supabase.from('tops').insert([testTop]).select();
        
        if (error) {
            return res.status(200).json({ status: "Insert Error", error });
        }
        
        // Cleanup
        if (data && data[0]) {
            await supabase.from('tops').delete().eq('id', data[0].id);
        }

        return res.status(200).json({ status: "Insert Success", data });
    } catch (err) {
        return res.status(200).json({ status: "Crash", message: err.message });
    }
}
