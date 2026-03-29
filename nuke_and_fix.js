import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const frontDir = path.join(process.cwd(), 'frontend');
console.log("[*] INICIANDO PURGA NUCLEAR DE FRONTEND...");

// 1. Destruir archivos fantasma de PostCSS y Tailwind viejo
const filesToKill = ['postcss.config.js', 'postcss.config.cjs', 'tailwind.config.js', 'tailwind.config.cjs', 'package-lock.json'];
filesToKill.forEach(f => {
    const p = path.join(frontDir, f);
    if (fs.existsSync(p)) { 
        fs.unlinkSync(p); 
        console.log(`[-] Destruido: ${f}`); 
    }
});

// 2. Destruir node_modules corrupto
const nodeMods = path.join(frontDir, 'node_modules');
if (fs.existsSync(nodeMods)) { 
    fs.rmSync(nodeMods, { recursive: true, force: true }); 
    console.log("[-] node_modules aniquilado."); 
}

// 3. Reescribir package.json blindado (Tailwind v4 puro)
const packageJson = {
  "name": "aeterium-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": { "dev": "vite", "build": "vite build" },
  "dependencies": {
    "lucide-react": "^0.344.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.3"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@vitejs/plugin-react": "^4.2.1",
    "tailwindcss": "^4.0.0",
    "vite": "^5.1.4"
  }
};
fs.writeFileSync(path.join(frontDir, 'package.json'), JSON.stringify(packageJson, null, 2));
console.log("[+] package.json reescrito.");

// 4. Reescribir vite.config.js
const viteConfig = `
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5174, proxy: { '/api': 'http://localhost:3000' } }
})
`;
fs.writeFileSync(path.join(frontDir, 'vite.config.js'), viteConfig.trim());
console.log("[+] vite.config.js reescrito.");

// 5. Reescribir index.css
const indexCss = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap');
@import "tailwindcss";

@theme {
  --font-sans: "Inter", sans-serif;
  --font-mono: "JetBrains Mono", monospace;
}
body { background-color: #FAFAFA; color: #111111; font-family: "Inter", sans-serif; }
`;
fs.writeFileSync(path.join(frontDir, 'src', 'index.css'), indexCss.trim());
console.log("[+] index.css reescrito.");

// 6. Instalar dependencias limpias
console.log("[*] Instalando dependencias limpias...");
execSync('npm install', { cwd: frontDir, stdio: 'inherit' });
console.log("[✅] PURGA COMPLETADA EXITOSAMENTE.");
