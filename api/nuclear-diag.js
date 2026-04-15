import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    const keys = Object.keys(process.env).filter(k => k.includes('SUPABASE'));
    
    let supabaseStatus = "Not initialized";
    let dbResult = null;
    let dbError = null;

    try {
        if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
            const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
            supabaseStatus = "Initialized";
            
            const { data, error } = await supabase.from('tops').select('count').limit(1);
            dbResult = data;
            dbError = error;
        } else {
            supabaseStatus = "Missing Env Vars";
        }
    } catch (err) {
        supabaseStatus = "Error: " + err.message;
    }

    return res.status(200).json({
        supabaseStatus,
        detectedKeys: keys,
        dbResult,
        dbError,
        envCheck: {
            urlPresent: !!process.env.SUPABASE_URL,
            keyPresent: !!process.env.SUPABASE_ANON_KEY
        }
    });
}
