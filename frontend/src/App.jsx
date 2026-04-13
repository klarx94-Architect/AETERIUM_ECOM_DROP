import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Shield, Zap } from 'lucide-react';
import GuerrillaIntel from './pages/GuerrillaIntel';
import DropeaSync from './pages/DropeaSync';

function Sidebar() {
  const location = useLocation();
  const links = [
    { to: '/', icon: <Zap size={18} className="text-yellow-400" />, label: 'Guerrilla Intel' },
    { to: '/sync', icon: <Shield size={18} />, label: 'Dropea Sync' },
  ];
  return (
    <aside className="w-72 bg-slate-900 text-white flex flex-col shadow-2xl z-10 shrink-0">
      <div className="p-8 border-b border-slate-800">
        <div className="flex items-center gap-3 mb-1">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-label="AETERIUM" xmlns="http://www.w3.org/2000/svg">
            <polygon points="16,2 30,28 2,28" fill="none" stroke="#facc15" strokeWidth="2" strokeLinejoin="round"/>
            <line x1="16" y1="12" x2="16" y2="22" stroke="#facc15" strokeWidth="1.5"/>
            <circle cx="16" cy="10" r="2" fill="#facc15"/>
          </svg>
          <h1 className="text-2xl font-bold tracking-tight">AETERIUM</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1 font-mono uppercase tracking-widest pl-11">Command Center</p>
      </div>
      <nav className="flex-1 p-6 space-y-2">
        {links.map(({ to, icon, label }) => {
          const active = location.pathname === to;
          return (
            <Link key={to} to={to}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                active ? 'bg-white/15 text-white border border-white/10' : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}>
              {icon}{label}
            </Link>
          );
        })}
      </nav>
      <div className="p-6 border-t border-slate-800">
        <p className="text-xs text-slate-600 font-mono">v1.0.1 — Guerrilla Edition</p>
      </div>
    </aside>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-[#FAFAFA] font-sans text-[#111111] overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <header className="bg-white border-b border-slate-200 px-10 py-5 sticky top-0 z-0 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-800 tracking-tight">Dashboard de Operaciones</h2>
          </header>
          <div className="p-8 max-w-7xl mx-auto">
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
