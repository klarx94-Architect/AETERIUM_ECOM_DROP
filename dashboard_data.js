import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function saveData(filename, data) {
    const filePath = path.join(__dirname, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`[DASHBOARD DATA] Resultados exportados exitosamente a: ${filePath}`);
}
