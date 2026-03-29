import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Shield, Zap, Search } from 'lucide-react';

// Vistas Placeholder para que el Router no falle
const GuerrillaIntel = () => (
  <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
    <h2 className="text-xl font-bold mb-4 font-sans text-slate-800">Inteligencia de Mercado</h2>
    <div className="flex gap-2 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
        <input type="text" placeholder="Ej: Productos con margen > 20€" className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg outline-none focus:border-slate-800 font-sans" />
      </div>
      <button className="bg-slate-900 text-white px-6 py-3 rounded-lg font-mono text-sm hover:bg-slate-800 transition-colors">INTEL SEARCH</button>
    </div>
    <div className="text-slate-500 font-mono text-sm border-t border-slate-100 pt-4">Conectando con motor de datos...</div>
  </div>
);

const DropeaSync = () => (
  <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm max-w-2xl">
    <h2 className="text-xl font-bold mb-4 font-sans text-slate-800">Sincronización de Órdenes (Dropea)</h2>
    <p className="text-slate-500 mb-6 font-sans text-sm">Registrar venta manual verificada (Marketplace/WhatsApp).</p>
    <div className="text-slate-500 font-mono text-sm border-t border-slate-100 pt-4">Formulario en construcción...</div>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-[#FAFAFA] font-sans text-[#111111]">
        {/* Sidebar Ultra-Premium */}
        <aside className="w-72 bg-slate-900 text-white flex flex-col shadow-2xl z-10">
          <div className="p-8 border-b border-slate-800">
            <h1 className="text-2xl font-bold tracking-tight font-sans">AETERIUM</h1>
            <p className="text-xs text-slate-400 mt-2 font-mono uppercase tracking-widest">Command Center</p>
          </div>
          <nav className="flex-1 p-6 space-y-3">
            <Link to="/" className="flex items-center gap-3 px-4 py-3 bg-white/10 rounded-lg text-sm font-medium transition-all hover:bg-white/20 border border-white/5">
              <Zap size={18} className="text-yellow-400" />
              Guerrilla Intel
            </Link>
            <Link to="/sync" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-white/5 hover:text-white rounded-lg text-sm font-medium transition-all">
              <Shield size={18} />
              Dropea Sync
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <header className="bg-white border-b border-slate-200 px-10 py-6 sticky top-0 z-0">
            <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Dashboard de Operaciones</h2>
          </header>
          <div className="p-10 max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<GuerrillaIntel />} />
              <Route path="/sync" element={<DropeaSync />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}
