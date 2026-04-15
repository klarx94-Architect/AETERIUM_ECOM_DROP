import React, { useEffect, useState } from 'react';
import { Search, ExternalLink, FileText, Loader2, X, TrendingUp, Package, ShoppingCart, DollarSign } from 'lucide-react';

function StatCard({ label, value, subtext, icon, trend }) {
    return (
        <div className="guerrilla-card flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{label}</span>
                <span className="p-1.5 bg-white/5 rounded-lg border border-white/5 text-aeterium-gold">{icon}</span>
            </div>
            <div>
                <div className="text-2xl font-black text-white mb-1">{value}</div>
                <div className={`text-[10px] font-bold flex items-center gap-1 ${trend > 0 ? 'text-emerald-500' : 'text-slate-500'}`}>
                    {trend > 0 && <TrendingUp size={10} />}
                    {subtext}
                </div>
            </div>
        </div>
    );
}

export default function GuerrillaIntel() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [prompt, setPrompt] = useState("");
    const [modal, setModal] = useState({ show: false, content: '', loading: false, title: '' });

    // Cálculos dinámicos
    const activeCount = products.length;
    
    const avgMargin = activeCount > 0 
        ? (products.reduce((acc, p) => acc + (parseFloat(p.margin) || 0), 0) / activeCount).toFixed(2)
        : "0.00";

    const totalStock = products.reduce((acc, p) => acc + (parseInt(p.stock) || 0), 0);
    
    // Revenue Est. Hoy lo transformamos a Beneficio Potencial del catálogo actual
    const potentialRevenue = products.reduce((acc, p) => acc + ((parseFloat(p.margin) || 0) * (parseInt(p.stock) || 0)), 0);
    const formattedPotential = potentialRevenue > 10000 
        ? `€${(potentialRevenue / 1000).toFixed(1)}k` 
        : `€${potentialRevenue.toFixed(0)}`;

    useEffect(() => {
        fetch('/api/products')
            .then(res => {
                if (!res.ok) throw new Error("Fallo de red");
                return res.json();
            })
            .then(data => { setProducts(Array.isArray(data) ? data : []); setLoading(false); })
            .catch(() => { setProducts([]); setLoading(false); });
    }, []);

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/scan-dynamic', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });
            const data = await res.json();
            setProducts(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const generateAI = async (p) => {
        setModal({ show: true, content: '', loading: true, title: p.name });
        try {
            const res = await fetch('/api/generate-strategy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(p)
            });
            const data = await res.json();
            setModal(prev => ({ ...prev, content: data.strategy, loading: false }));
        } catch(err) {
            setModal(prev => ({ ...prev, content: 'Error generando Estrategia de IA.', loading: false }));
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Summary Stats Region */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Margen Promedio" value={`€${avgMargin}`} subtext="+Real Time" trend={1} icon={<TrendingUp size={16}/>} />
                <StatCard label="Productos Activos" value={activeCount} subtext="Live Nodes" trend={1} icon={<Package size={16}/>} />
                <StatCard label="Stock Total" value={totalStock} subtext="Unidades" trend={1} icon={<ShoppingCart size={16}/>} />
                <StatCard label="Beneficio Pot." value={formattedPotential} subtext="Basado en Intel" trend={1} icon={<DollarSign size={16}/>} />
            </div>

            {/* Main Content Area */}
            <section className="guerrilla-card">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div>
                        <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                           Inteligencia de Mercado 
                           <span className="intel-gradient h-1.5 w-1.5 rounded-full"></span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-mono">Motor de inteligencia de mercado • Dropea API</p>
                    </div>

                    <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                            <input 
                                type="text" 
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Escribe tu prompt de búsqueda..." 
                                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:ring-1 focus:ring-aeterium-gold/50 outline-none transition-all placeholder:text-slate-700 text-white font-medium"
                            />
                        </div>
                        <button type="submit" disabled={loading} className="intel-gradient px-6 py-2 rounded-lg text-aeterium-black text-xs font-black uppercase tracking-wider flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-gold">
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                            Intel Search
                        </button>
                    </form>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-y-2 min-w-[900px]">
                        <thead>
                            <tr className="text-[10px] uppercase font-mono tracking-[0.2em] text-slate-600">
                                <th className="py-2 px-4">Producto</th>
                                <th className="py-2 px-4 text-center">Stock</th>
                                <th className="py-2 px-4 text-center">Costo / PVP</th>
                                <th className="py-2 px-4 text-center text-aeterium-gold">Margen</th>
                                <th className="py-2 px-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {loading && products.length === 0 ? (
                                <tr><td colSpan="5" className="py-20 text-center"><Loader2 size={24} className="animate-spin text-aeterium-gold mx-auto mb-4"/> <span className="text-xs font-mono text-slate-500 uppercase">Sincronizando Nodos de Inteligencia...</span></td></tr>
                            ) : products.length === 0 ? (
                                <tr><td colSpan="5" className="py-20 text-center text-slate-500 font-mono text-xs uppercase tracking-widest">Sin resultados. Lanza una búsqueda Intel.</td></tr>
                            ) : (
                                products.map(p => (
                                    <tr key={p.id} className="group">
                                        <td className="py-4 px-4 bg-white/[0.02] rounded-l-xl border-y border-l border-white/5 group-hover:bg-white/[0.04] transition-colors">
                                            <div className="text-[10px] font-mono text-aeterium-gold mb-1 uppercase tracking-widest">{p.category}</div>
                                            <div className="font-bold text-white text-base leading-tight">{p.name}</div>
                                        </td>
                                        <td className="py-4 px-4 bg-white/[0.02] border-y border-white/5 text-center group-hover:bg-white/[0.04] transition-colors">
                                            <span className="font-mono text-sm font-bold text-emerald-500 bg-emerald-500/5 px-3 py-1 rounded-full border border-emerald-500/10">{p.stock}</span>
                                        </td>
                                        <td className="py-4 px-4 bg-white/[0.02] border-y border-white/5 text-center font-mono text-[13px] group-hover:bg-white/[0.04] transition-colors">
                                            <span className="text-slate-500">€{parseFloat(p.cost).toFixed(2)}</span>
                                            <span className="mx-2 text-slate-800">/</span>
                                            <span className="font-bold text-white">€{parseFloat(p.pvp).toFixed(2)}</span>
                                        </td>
                                        <td className="py-4 px-4 bg-white/[0.02] border-y border-white/5 text-center font-mono font-black text-aeterium-gold text-lg group-hover:bg-white/[0.04] transition-colors">
                                            €{parseFloat(p.margin).toFixed(2)}
                                        </td>
                                        <td className="py-4 px-4 bg-white/[0.02] rounded-r-xl border-y border-r border-white/5 group-hover:bg-white/[0.04] transition-colors text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <a 
                                                    href={`https://app.dropea.com/products/${p.id}`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="p-2 border border-white/10 hover:border-aeterium-gold/50 hover:bg-aeterium-gold/10 text-slate-400 hover:text-aeterium-gold rounded-lg transition-all"
                                                    title="Ver en Dropea"
                                                >
                                                    <ExternalLink size={16} />
                                                </a>
                                                <button 
                                                    onClick={() => generateAI(p)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:border-aeterium-gold/50 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
                                                >
                                                    <FileText size={14} className="text-aeterium-gold" /> Estrategia IA
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {modal.show && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-aeterium-black/80 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="guerrilla-card w-full max-w-4xl flex flex-col max-h-[85vh] shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
                            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between mb-2">
                                <div>
                                    <h3 className="text-sm font-black text-aeterium-gold uppercase tracking-[0.3em] font-mono">IA Tactical Analysis</h3>
                                    <p className="text-xs text-slate-500 mt-1 uppercase font-bold">{modal.title}</p>
                                </div>
                                <button onClick={() => setModal({ show: false, content: '', loading: false, title: '' })} className="p-2 text-slate-600 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                                {modal.loading ? (
                                    <div className="flex flex-col items-center justify-center py-20 space-y-6">
                                        <div className="relative">
                                           <Loader2 size={48} className="animate-spin text-aeterium-gold" />
                                           <div className="absolute inset-0 blur-2xl bg-aeterium-gold/20 animate-pulse"></div>
                                        </div>
                                        <p className="text-[10px] font-black tracking-widest text-slate-500 font-mono text-center uppercase">Analizando vectores de guerrilla comercial...<br/>Sintetizando informe estratégico.</p>
                                    </div>
                                ) : (
                                    <div className="prose prose-invert max-w-none font-sans text-slate-300 text-sm leading-relaxed">
                                        {modal.content.split('\n').map((line, i) => (
                                            <p key={i} className={line.startsWith('#') ? 'text-aeterium-gold font-bold text-lg border-b border-white/5 pb-2 mt-6 mb-4' : 'mb-3'}>
                                                {line}
                                            </p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}
