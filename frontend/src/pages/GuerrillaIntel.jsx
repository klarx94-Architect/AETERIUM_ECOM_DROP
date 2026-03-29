import React, { useEffect, useState } from 'react';
import { Search, ExternalLink, FileText, Loader2, X } from 'lucide-react';

export default function GuerrillaIntel() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [prompt, setPrompt] = useState("");
    const [modal, setModal] = useState({ show: false, content: '', loading: false, title: '' });

    useEffect(() => {
        fetch('/api/products')
            .then(res => res.json())
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
            setModal(prev => ({ ...prev, content: 'Error generando PDF Intel.', loading: false }));
        }
    };

    return (
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-7xl mx-auto">
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-800">Inteligencia de Mercado</h3>
                <p className="text-sm text-slate-500">Top Productos extraídos bajo la Directiva de Guerrilla.</p>
            </div>

            <form onSubmit={handleSearch} className="mb-6 flex gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Busca productos con alto margen..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-800"
                    />
                </div>
                <button type="submit" disabled={loading} className="px-6 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center gap-2 whitespace-nowrap">
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                    Intel Search
                </button>
            </form>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left border-collapse min-w-[850px]">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            <th className="py-3 px-4">Producto</th>
                            <th className="py-3 px-4 text-right w-24">Stock</th>
                            <th className="py-3 px-4 text-right w-36">Costo / PVP</th>
                            <th className="py-3 px-4 text-right w-24 text-indigo-600">Margen</th>
                            <th className="py-3 px-4 text-center w-[280px]">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm bg-white">
                        {loading && products.length === 0 ? (
                            <tr><td colSpan="5" className="py-8 text-center text-slate-500"><div className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin"/> Cargando Inteligencia Dinámica...</div></td></tr>
                        ) : products.length === 0 ? (
                            <tr><td colSpan="5" className="py-8 text-center text-slate-500">Sin datos.</td></tr>
                        ) : (
                            products.map(p => (
                                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-4 px-4">
                                        <div className="text-xs font-medium text-slate-400 mb-0.5 uppercase tracking-wide">{p.category}</div>
                                        <div className="font-semibold text-slate-800 leading-tight">{p.name} <span className="font-mono text-[10px] bg-slate-100 border border-slate-200 px-1 py-0.5 rounded text-slate-500 ml-1.5 font-medium">ID:{p.id}</span></div>
                                    </td>
                                    <td className="py-4 px-4 text-right align-top pt-5">
                                        <span className="font-mono text-xs font-semibold bg-emerald-50 text-emerald-700 px-2 py-1 rounded border border-emerald-100">{p.stock}</span>
                                    </td>
                                    <td className="py-4 px-4 text-right align-top pt-5 font-mono text-[13px]">
                                        <span className="text-slate-500">€{parseFloat(p.cost).toFixed(2)}</span><br/>
                                        <span className="font-semibold text-slate-800">€{parseFloat(p.pvp).toFixed(2)}</span>
                                    </td>
                                    <td className="py-4 px-4 text-right align-top pt-5 font-mono font-bold text-indigo-600 text-[13px]">
                                        €{parseFloat(p.margin).toFixed(2)}
                                    </td>
                                    <td className="py-4 px-4 align-top pt-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <a 
                                                href={`https://app.dropea.com/products/${p.id}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 border border-slate-800 hover:bg-slate-800 hover:text-white text-slate-800 text-xs font-mono py-1 px-3 rounded transition-colors"
                                            >
                                                <ExternalLink size={14} /> Ver Dropea
                                            </a>
                                            <button 
                                                onClick={() => generateAI(p)}
                                                className="flex items-center gap-1.5 border border-slate-800 hover:bg-slate-800 hover:text-white text-slate-800 text-xs font-mono py-1 px-3 rounded transition-colors"
                                            >
                                                <FileText size={14} /> Generar PDF Intel
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] border border-slate-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-[#FAFAFA] rounded-t-xl">
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest font-mono">Estrategia AI (Gemini)</h3>
                                <p className="text-sm text-slate-600 mt-1">{modal.title}</p>
                            </div>
                            <button onClick={() => setModal({ show: false, content: '', loading: false, title: '' })} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 bg-white">
                            {modal.loading ? (
                                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                    <Loader2 size={32} className="animate-spin text-indigo-600" />
                                    <p className="text-sm font-medium text-slate-500 font-mono text-center">Analizando vectores de guerrilla...<br/>Sintetizando prompts e hiper-parámetros.</p>
                                </div>
                            ) : (
                                <pre className="whitespace-pre-wrap font-mono text-[13px] text-slate-800 bg-[#FAFAFA] p-5 border border-slate-200 rounded-lg leading-relaxed shadow-inner">
                                    {modal.content}
                                </pre>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
