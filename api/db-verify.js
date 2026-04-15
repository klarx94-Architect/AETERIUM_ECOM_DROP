import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!url || !key) {
        return res.status(200).json({ error: "Still missing VITE_ env vars", env: Object.keys(process.env).filter(k => k.includes('SUPABASE')) });
    }

    const supabase = createClient(url, key);
    
    try {
        const { data, error } = await supabase.from('tops').select('*').limit(1);
        if (error) {
            return res.status(200).json({ status: "Connect Error", error });
        }
        return res.status(200).json({ status: "Success", data });
    } catch (err) {
        return res.status(200).json({ status: "Crash", message: err.message });
    }
}
