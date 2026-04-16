import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Shield, Zap, LayoutGrid, Settings, BarChart3, Sparkles, Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import GuerrillaIntel from './pages/GuerrillaIntel';
import DropeaSync from './pages/DropeaSync';
import TopWarRoom from './pages/TopWarRoom';
import TopList from './pages/TopList';

function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation();
  const links = [
    { to: '/', icon: <Zap size={18} />, label: 'Guerrilla Intel', live: true },
    { to: '/tops', icon: <Sparkles size={18} />, label: 'Tops / Sala de Guerra' },
    { to: '/sync', icon: <LayoutGrid size={18} />, label: 'Dropea Sync' },
    { to: '/analytics', icon: <BarChart3 size={18} />, label: 'Analytics', disabled: true },
    { to: '/config', icon: <Settings size={18} />, label: 'Configuración' },
  ];

  return (
    <aside className={`${collapsed ? 'w-20' : 'w-72'} transition-all duration-300 glass-sidebar border-r border-aeterium-border text-white flex flex-col z-10 shrink-0 relative`}>
      <div className={`p-8 border-b border-aeterium-border ${collapsed ? 'px-4' : ''}`}>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-aeterium-gold/10 rounded-lg border border-aeterium-gold/20 shrink-0">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="16,2 30,28 2,28" fill="none" stroke="#facc15" strokeWidth="2.5" strokeLinejoin="round"/>
              <circle cx="16" cy="18" r="4" fill="#facc15" className="animate-pulse"/>
            </svg>
          </div>
          {!collapsed && (
            <div className="animate-in fade-in slide-in-from-left-2 duration-300">
              <h1 className="text-xl font-black tracking-tighter leading-none">AETERIUM</h1>
              <p className="text-[10px] text-aeterium-gold font-mono uppercase tracking-[0.2em] mt-1">Command Center</p>
            </div>
          )}
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 mt-4">
        {links.map(({ to, icon, label, live, disabled }) => {
          const active = location.pathname === to;
          if (disabled) return (
             <div key={label} className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-4 py-3 rounded-lg text-slate-600 cursor-not-allowed opacity-50`}>
                <div className="flex items-center gap-3">
                  {icon}
                  {!collapsed && <span className="text-sm font-medium animate-in fade-in duration-300">{label}</span>}
                </div>
                {!collapsed && <span className="text-[9px] font-bold bg-slate-800 px-1.5 py-0.5 rounded uppercase">Soon</span>}
             </div>
          );
          
          return (
            <Link key={to} to={to} title={collapsed ? label : ''}
              className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-4 py-3 rounded-lg text-sm font-medium transition-all group ${
                active ? 'bg-aeterium-gold/10 text-white border border-aeterium-gold/30 shadow-gold' : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}>
              <div className="flex items-center gap-3">
                <span className={active ? 'text-aeterium-gold' : 'text-slate-500 group-hover:text-aeterium-gold transition-colors'}>{icon}</span>
                {!collapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-300">{label}</span>}
              </div>
              {!collapsed && live && <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-aeterium-border">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center px-0' : 'px-2'} py-3 bg-white/5 rounded-xl border border-white/5`}>
           <div className="w-8 h-8 rounded-full bg-aeterium-gold flex items-center justify-center text-aeterium-black font-bold text-xs shrink-0">K</div>
           {!collapsed && (
             <div className="flex-1 overflow-hidden animate-in fade-in duration-300">
                <p className="text-xs font-bold truncate">Project Admin</p>
                <p className="text-[10px] text-slate-500 font-mono">ID: ARCHITECT-01</p>
             </div>
           )}
        </div>
      </div>
    </aside>
  );
}

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-aeterium-black font-sans text-slate-200 overflow-hidden">
        <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
        <main className="flex-1 overflow-y-auto relative">
          <header className="bg-aeterium-black/50 backdrop-blur-xl border-b border-aeterium-border px-8 py-4 sticky top-0 z-20 flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-aeterium-gold transition-all"
                title={sidebarCollapsed ? "Expandir Menú" : "Colapsar Menú"}
              >
                {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
              </button>
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                Operaciones Guerrilla
                <span className="text-aeterium-gold/60 font-mono text-[10px] border border-aeterium-gold/20 px-2 py-0.5 rounded bg-aeterium-gold/5 hidden sm:inline-block">NODE_INTEL_STABLE</span>
              </h2>
            </div>
            <div className="flex items-center gap-4">
               <div className="hidden sm:flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Sistema Activo</span>
               </div>
            </div>
          </header>
          
          <div className="p-6 md:p-10 max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<GuerrillaIntel />} />
              <Route path="/tops" element={<TopList />} />
              <Route path="/sync" element={<DropeaSync />} />
              <Route path="/top/:id" element={<TopWarRoom />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}
