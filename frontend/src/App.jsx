import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Zap, RefreshCw, BarChart3, Settings, ChevronRight, Activity } from 'lucide-react';
import GuerrillaIntel from './pages/GuerrillaIntel';
import DropeaSync from './pages/DropeaSync';

// KPI Cards para el header del dashboard
const kpiData = [
  { label: 'Margen Promedio', value: '€34.21', change: '+12.4%', up: true },
  { label: 'Productos Activos', value: '47', change: '+5 hoy', up: true },
  { label: 'Órdenes Pendientes', value: '3', change: 'COD', up: null },
  { label: 'Revenue Est. Hoy', value: '€171', change: '5 ventas', up: true },
];

function KPICard({ label, value, change, up }) {
  return (
    <div className="phantom-card p-5 flex flex-col gap-3 animate-fade-in">
      <span className="phantom-label">{label}</span>
      <span className="font-display text-2xl font-bold text-phantom-text tracking-tight">
        {value}
      </span>
      <span className={`text-xs font-mono font-semibold ${
        up === true ? 'text-phantom-green' :
        up === false ? 'text-phantom-red' :
        'text-phantom-muted'
      }`}>
        {up === true ? '↑' : up === false ? '↓' : '●'} {change}
      </span>
    </div>
  );
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = [
    { to: '/', icon: Zap, label: 'Guerrilla Intel', badge: 'LIVE' },
    { to: '/sync', icon: RefreshCw, label: 'Dropea Sync', badge: null },
    { to: '/analytics', icon: BarChart3, label: 'Analytics', badge: 'SOON' },
    { to: '/settings', icon: Settings, label: 'Configuración', badge: null },
  ];

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-phantom-bg overflow-hidden">

        {/* SIDEBAR PHANTOM GOLD */}
        <aside className={`${
          sidebarOpen ? 'w-64' : 'w-16'
        } bg-phantom-surface border-r border-phantom-border flex flex-col transition-all duration-300 ease-in-out z-20 flex-shrink-0`}>

          {/* Logo */}
          <div className="p-5 border-b border-phantom-border flex items-center gap-3 min-h-[72px]">
            {/* SVG Logo inline */}
            <div className="w-8 h-8 flex-shrink-0">
              <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <polygon points="16,2 30,10 30,22 16,30 2,22 2,10" fill="rgba(245,158,11,0.10)" stroke="#F59E0B" strokeWidth="1.5"/>
                <polygon points="16,7 25,12 25,20 16,25 7,20 7,12" fill="rgba(245,158,11,0.08)" stroke="rgba(245,158,11,0.5)" strokeWidth="1"/>
                <circle cx="16" cy="16" r="3" fill="#F59E0B"/>
                <line x1="16" y1="7" x2="16" y2="13" stroke="#F59E0B" strokeWidth="1.2"/>
                <line x1="16" y1="19" x2="16" y2="25" stroke="#F59E0B" strokeWidth="1.2"/>
                <line x1="7" y1="12" x2="13" y2="15" stroke="rgba(245,158,11,0.6)" strokeWidth="1"/>
                <line x1="19" y1="17" x2="25" y2="20" stroke="rgba(245,158,11,0.6)" strokeWidth="1"/>
              </svg>
            </div>
            {sidebarOpen && (
              <div className="animate-fade-in overflow-hidden">
                <h1 className="font-display text-base font-bold text-phantom-text tracking-wider">AETERIUM</h1>
                <p className="text-[10px] text-phantom-gold font-mono uppercase tracking-[0.2em] opacity-80">Command Center</p>
              </div>
            )}
          </div>

          {/* Nav */}
          <nav className="flex-1 p-3 space-y-1 overflow-hidden">
            {navItems.map(({ to, icon: Icon, label, badge }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-phantom-gold-dim text-phantom-gold border border-phantom-border-gold'
                      : 'text-phantom-muted hover:text-phantom-text hover:bg-phantom-surface2'
                  }`
                }
              >
                <Icon size={17} className="flex-shrink-0" />
                {sidebarOpen && (
                  <span className="flex-1 animate-fade-in truncate">{label}</span>
                )}
                {sidebarOpen && badge && (
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                    badge === 'LIVE' ? 'bg-phantom-green-dim text-phantom-green animate-pulse-gold' :
                    badge === 'SOON' ? 'bg-phantom-surface2 text-phantom-faint' : ''
                  }`}>{badge}</span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Toggle sidebar */}
          <div className="p-3 border-t border-phantom-border">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="phantom-btn-ghost w-full justify-center"
              aria-label={sidebarOpen ? 'Colapsar sidebar' : 'Expandir sidebar'}
            >
              <ChevronRight size={15} className={`transition-transform duration-300 ${
                sidebarOpen ? 'rotate-180' : ''
              }`} />
              {sidebarOpen && <span className="text-xs">Colapsar</span>}
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* TOP HEADER */}
          <header className="bg-phantom-surface border-b border-phantom-border px-8 py-4 flex items-center justify-between flex-shrink-0">
            <div>
              <Routes>
                <Route path="/" element={
                  <div>
                    <h2 className="font-display text-xl font-bold text-phantom-text">Guerrilla Intel</h2>
                    <p className="text-xs text-phantom-muted font-mono mt-0.5">Motor de inteligencia de mercado • Dropea API</p>
                  </div>
                } />
                <Route path="/sync" element={
                  <div>
                    <h2 className="font-display text-xl font-bold text-phantom-text">Dropea Sync</h2>
                    <p className="text-xs text-phantom-muted font-mono mt-0.5">Registro manual de órdenes verificadas</p>
                  </div>
                } />
                <Route path="*" element={
                  <div>
                    <h2 className="font-display text-xl font-bold text-phantom-text">AETERIUM</h2>
                    <p className="text-xs text-phantom-muted font-mono mt-0.5">Command Center</p>
                  </div>
                } />
              </Routes>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-phantom-green-dim rounded-full">
                <Activity size={12} className="text-phantom-green animate-pulse" />
                <span className="text-xs font-mono text-phantom-green font-semibold">SISTEMA ACTIVO</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-phantom-gold-dim border border-phantom-border-gold flex items-center justify-center">
                <span className="text-xs font-bold text-phantom-gold font-mono">K</span>
              </div>
            </div>
          </header>

          {/* KPI STRIP */}
          <div className="px-8 py-4 border-b border-phantom-border bg-phantom-bg">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {kpiData.map((kpi, i) => <KPICard key={i} {...kpi} />)}
            </div>
          </div>

          {/* PAGE CONTENT */}
          <main className="flex-1 overflow-y-auto p-8">
            <Routes>
              <Route path="/" element={<GuerrillaIntel />} />
              <Route path="/sync" element={<DropeaSync />} />
              <Route path="*" element={
                <div className="flex flex-col items-center justify-center h-64 text-phantom-muted">
                  <Zap size={40} className="text-phantom-faint mb-4" />
                  <p className="font-mono text-sm">Módulo en construcción...</p>
                </div>
              } />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
