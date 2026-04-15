export default function handler(req, res) {
    res.status(200).json({
        gemini_key_exists: !!process.env.GEMINI_API_KEY,
        node_version: process.version,
        env_vars: Object.keys(process.env).filter(k => k.includes('GEMINI') || k.includes('SUPABASE'))
    });
}
