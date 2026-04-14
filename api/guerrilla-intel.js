import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
        const filePath = path.join(process.cwd(), 'top5_guerrilla.json');
        
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            res.status(200).json(JSON.parse(data));
        } else {
            console.log("[INTEL] Archivo top5_guerrilla.json no encontrado, devolviendo lista vacía.");
            res.status(200).json([]);
        }
    } catch(e) {
        console.error("[ERROR INTEL] ", e.message);
        res.status(500).json({ error: e.message });
    }
}
