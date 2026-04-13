import React, { useEffect, useState } from 'react';
import { Search, ExternalLink, FileText, Loader2, X, TrendingUp, Package, DollarSign, Sparkles } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

function MarginBadge({ margin }) {
  const val = parseFloat(margin);
  if (val >= 30) return <span className="metric-badge-green">+€{val.toFixed(2)}</span>;
  if (val >= 15) return <span className="metric-badge-yellow">+€{val.toFixed(2)}</span>;
  return <span className="metric-badge-red">+€{val.toFixed(2)}</span>;
}

function SkeletonRow() {
  return (
    <tr className="border-b border-phantom-border">
      <td className="py-4 px-4"><div className="skeleton h-4 w-48" /></td>
      <td className="py-4 px-4"><div className="skeleton h-4 w-12 ml-auto" /></td>
      <td className="py-4 px-4"><div className="skeleton h-4 w-24 ml-auto" /></td>
      <td className="py-4 px-4"><div className="skeleton h-5 w-16 ml-auto" /></td>
      <td className="py-4 px-4"><div className="skeleton h-8 w-32 ml-auto" /></td>
    </tr>
  );
}

export default function GuerrillaIntel() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [modal, setModal] = useState({ show: false, content: '', loading: false, title: '' });

  useEffect(() => {
    fetch(`${API_BASE}/api/products`)
      .then(res => res.json())
      .then(data => { setProducts(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setProducts([]); setLoading(false); });
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/scan-dynamic`, {
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
      const res = await fetch(`${API_BASE}/api/generate-strategy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p)
      });
      const data = await res.json();
      setModal(prev => ({ ...prev, content: data.strategy, loading: false }));
    } catch (err) {
      setModal(prev => ({ ...prev, content: 'Error al conectar con el motor IA.', loading: false }));
    }
  };

  const totalMargen = products.reduce((s, p) => s + (parseFloat(p.margin) || 0), 0);
  const avgMargen = products.length > 0 ? totalMargen / products.length : 0;
  const topProduct = products.length > 0
    ? products.reduce((best, p) => parseFloat(p.margin) > parseFloat(best.margin) ? p : best, products[0])
    : null;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* SEARCH BAR */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-phantom-faint" size={16} />
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Busca productos: ej. 'freidoras aire alto margen', 'hogar verano'..."
            className="phantom-input pl-10"
          />
        </div>
        <button type="submit" disabled={loading} className="phantom-btn-primary whitespace-nowrap">
          {loading
            ? <><Loader2 size={15} className="animate-spin" /> Escaneando...</>
            : <><Search size={15} /> Intel Search</>
          }
        </button>
      </form>

      {/* MINI STATS BAR — solo si hay productos */}
      {products.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-3 phantom-card p-4">
            <div className="w-8 h-8 rounded-lg bg-phantom-gold-dim flex items-center justify-center flex-shrink-0">
              <Package size={15} className="text-phantom-gold" />
            </div>
            <div>
              <p className="phantom-label">Resultados</p>
              <p className="text-lg font-bold font-mono text-phantom-text">{products.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 phantom-card p-4">
            <div className="w-8 h-8 rounded-lg bg-phantom-green-dim flex items-center justify-center flex-shrink-0">
              <TrendingUp size={15} className="text-phantom-green" />
            </div>
            <div>
              <p className="phantom-label">Margen Medio</p>
              <p className="text-lg font-bold font-mono text-phantom-green">€{avgMargen.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 phantom-card p-4">
            <div className="w-8 h-8 rounded-lg bg-phantom-gold-dim flex items-center justify-center flex-shrink-0">
              <DollarSign size={15} className="text-phantom-gold" />
            </div>
            <div>
              <p className="phantom-label">Top Margen</p>
              <p className="text-lg font-bold font-mono text-phantom-gold">€{topProduct ? parseFloat(topProduct.margin).toFixed(2) : '0.00'}</p>
            </div>
          </div>
        </div>
      )}

      {/* TABLA PRINCIPAL */}
      <div className="phantom-card overflow-hidden">
        <div className="px-6 py-4 border-b border-phantom-border flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold text-phantom-text">Inteligencia de Mercado</h3>
          <span className="text-xs font-mono text-phantom-faint">Directiva Guerrilla • Dropea API</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[780px]">
            <thead>
              <tr className="border-b border-phantom-border">
                {['Producto', 'Stock', 'Costo / PVP', 'Margen', 'Acciones'].map((h, i) => (
                  <th key={h} className={`py-3 px-4 phantom-label ${
                    i > 0 && i < 4 ? 'text-right' : i === 4 ? 'text-center' : ''
                  }`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-phantom-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Search size={32} className="text-phantom-faint" />
                      <p className="text-sm text-phantom-muted font-mono">Sin resultados. Lanza una búsqueda Intel.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((p, i) => (
                  <tr key={i} className="hover:bg-phantom-gold-glow transition-colors duration-150 group">
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-phantom-text group-hover:text-phantom-gold transition-colors truncate max-w-[260px]">
                          {p.name}
                        </span>
                        {p.id && <span className="text-xs font-mono text-phantom-faint">ID: {p.id}</span>}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className={`font-mono text-sm font-medium ${
                        parseInt(p.stock) > 100 ? 'text-phantom-green' :
                        parseInt(p.stock) > 20 ? 'text-phantom-yellow' : 'text-phantom-red'
                      }`}>{p.stock || '—'}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex flex-col gap-0.5 items-end">
                        <span className="text-xs font-mono text-phantom-muted">{p.cost ? `€${parseFloat(p.cost).toFixed(2)}` : '—'}</span>
                        <span className="text-sm font-mono font-medium text-phantom-text">{p.pvp ? `€${parseFloat(p.pvp).toFixed(2)}` : '—'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <MarginBadge margin={p.margin || 0} />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-2">
                        {p.url && (
                          <a href={p.url} target="_blank" rel="noopener noreferrer"
                            className="phantom-btn-ghost px-2.5 py-1.5 text-xs"
                            title="Ver en Dropea">
                            <ExternalLink size={13} />
                          </a>
                        )}
                        <button
                          onClick={() => generateAI(p)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-phantom-gold-dim border border-phantom-border-gold text-phantom-gold rounded-lg text-xs font-semibold hover:bg-phantom-gold hover:text-phantom-bg transition-all duration-200"
                          title="Generar estrategia IA"
                        >
                          <Sparkles size={12} />
                          Estrategia IA
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL ESTRATEGIA IA */}
      {modal.show && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setModal({ show: false, content: '', loading: false, title: '' })}
          />
          <div className="relative ml-auto w-full max-w-xl h-full bg-phantom-surface border-l border-phantom-border shadow-phantom-lg animate-slide-in flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-phantom-border flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={16} className="text-phantom-gold" />
                  <span className="phantom-label">Estrategia Guerrilla IA</span>
                </div>
                <h3 className="font-display text-base font-bold text-phantom-text leading-snug line-clamp-2">{modal.title}</h3>
              </div>
              <button
                onClick={() => setModal({ show: false, content: '', loading: false, title: '' })}
                className="phantom-btn-ghost p-2 flex-shrink-0"
                aria-label="Cerrar modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {modal.loading ? (
                <div className="flex flex-col items-center justify-center h-48 gap-4">
                  <Loader2 size={32} className="text-phantom-gold animate-spin" />
                  <p className="text-sm font-mono text-phantom-muted">Generando inteligencia táctica...</p>
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-2 h-2 rounded-full bg-phantom-gold opacity-60"
                        style={{ animation: `pulseGold 1.5s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="prose prose-invert prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-mono text-sm text-phantom-text leading-relaxed bg-phantom-bg rounded-lg p-4 border border-phantom-border">
                    {modal.content}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {!modal.loading && modal.content && (
              <div className="p-6 border-t border-phantom-border">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(modal.content);
                  }}
                  className="phantom-btn-primary w-full justify-center"
                >
                  <FileText size={15} />
                  Copiar Estrategia
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
