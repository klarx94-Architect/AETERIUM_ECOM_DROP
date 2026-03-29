import React, { useEffect, useState } from 'react';

export default function MarketIntelTable() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [prompt, setPrompt] = useState("");
    const [strategyModal, setStrategyModal] = useState({ show: false, content: '', loading: false, productName: '' });

    // Initial load default products
    useEffect(() => {
        fetch('/api/products')
            .then(res => res.json())
            .then(data => { setProducts(Array.isArray(data) ? data : []); setLoading(false); })
            .catch(() => setLoading(false));
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
        setStrategyModal({ show: true, content: '', loading: true, productName: p.name });
        try {
            const res = await fetch('/api/generate-strategy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(p)
            });
            const data = await res.json();
            setStrategyModal(prev => ({ ...prev, content: data.strategy, loading: false }));
        } catch(err) {
            setStrategyModal(prev => ({ ...prev, content: 'Error generando...', loading: false }));
        }
    };

    return (
        <div>
            {/* Buscador Dinámico Agent Prompt */}
            <form onSubmit={handleSearch} className="mb-6 flex gap-3">
                <input 
                    type="text" 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder='Ej: "Busca productos de verano con stock > 100 y margen > 15€"' 
                    className="flex-1 px-5 py-3 border border-slate-300 bg-slate-50 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all"
                />
                <button type="submit" disabled={loading} className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm whitespace-nowrap">
                    {loading ? 'Analizando...' : 'Intel Search ✨'}
                </button>
            </form>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-500">
                            <th className="py-3 px-4">Categoría / Producto</th>
                            <th className="py-3 px-4 text-right">Stock</th>
                            <th className="py-3 px-4 text-right">Costo / PVP</th>
                            <th className="py-3 px-4 text-right text-indigo-600">Margen R.</th>
                            <th className="py-3 px-4 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                        {loading && products.length === 0 ? (
                            <tr><td colSpan="5" className="py-8 text-center text-slate-400">Cargando Inteligencia Dinámica...</td></tr>
                        ) : products.length === 0 ? (
                            <tr><td colSpan="5" className="py-8 text-center text-slate-500">No hay resultados en la API para tu análisis.</td></tr>
                        ) : (
                            products.map(p => (
                                <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="py-4 px-4">
                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">{p.category}</span>
                                        <span className="font-semibold text-slate-800">{p.name}</span>
                                        <span className="text-[10px] text-slate-400 ml-2 font-mono border border-slate-200 bg-white px-1 py-0.5 rounded">ID:{p.id}</span>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                            {p.stock} ud
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <span className="text-slate-500">€{parseFloat(p.cost).toFixed(2)}</span> / 
                                        <span className="font-semibold text-slate-800">€{parseFloat(p.pvp).toFixed(2)}</span>
                                    </td>
                                    <td className="py-4 px-4 text-right font-bold text-indigo-600">
                                        €{parseFloat(p.margin).toFixed(2)}
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <a 
                                                href={`https://app.dropea.com/products/${p.id}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="px-3 py-1.5 bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 rounded text-xs font-semibold transition-colors"
                                            >
                                                Dropea ↗
                                            </a>
                                            <button 
                                                onClick={() => generateAI(p)}
                                                className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded text-xs font-semibold transition-colors"
                                            >
                                                ⚡ IA
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* AI Generator Modal */}
            {strategyModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">AI Strategy Core</h3>
                                <p className="text-xs text-slate-500 mt-0.5">{strategyModal.productName}</p>
                            </div>
                            <button onClick={() => setStrategyModal({ show: false, content: '', loading: false, productName: '' })} className="text-slate-400 hover:text-slate-700 text-2xl leading-none">&times;</button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            {strategyModal.loading ? (
                                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                                    <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                                    <p className="text-sm font-semibold text-slate-600 animate-pulse">Generando copys milimétricos...</p>
                                </div>
                            ) : (
                                <div className="prose prose-sm max-w-none">
                                    <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 p-5 bg-slate-50 border border-slate-100 rounded-lg">{strategyModal.content}</pre>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
