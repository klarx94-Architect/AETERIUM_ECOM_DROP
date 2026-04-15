import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { Shield, Loader2, ArrowLeft, Terminal, Server, Zap } from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export default function TopWarRoom() {
    const { id } = useParams();
    const [top, setTop] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!supabase) {
            setError("No se detectó configuración de Supabase (VITE_SUPABASE_URL / ANON_KEY en el frontend). El acceso a la War Room requiere enlazar las variables en el entorno Vercel del Frontend.");
            setLoading(false);
            return;
        }

        async function fetchWarRoom() {
            try {
                // 1. Obtener Top
                const { data: topData, error: topError } = await supabase
                    .from('tops')
                    .select('*')
                    .eq('id', id)
                    .single();
                
                if (topError) throw new Error("No se pudo cargar el Top (posible 404 o problema interno).");
                setTop(topData);

                // 2. Obtener productos de este top
                const { data: prodData, error: prodError } = await supabase
                    .from('top_products')
                    .select('*')
                    .eq('top_id', id)
                    .order('margin', { ascending: false });

                if (prodError) throw new Error("No se pudieron cargar los nodos estratégicos de este top.");
                setProducts(prodData || []);

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        
        fetchWarRoom();
    }, [id]);

    const calculatePotentialMargin = () => {
        return products.reduce((acc, p) => {
            const margin = parseFloat(p.margin) || 0;
            const stock = parseInt(p.stock) || 0;
            return acc + (margin * stock);
        }, 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "—";
        return new Date(dateString).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-40 animate-in fade-in duration-500">
                <Loader2 size={40} className="animate-spin text-aeterium-gold mb-4" />
                <p className="text-xs font-mono uppercase tracking-[0.2em] text-slate-500">Desplegando Sala de Guerra...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 guerrilla-card max-w-2xl mx-auto border-red-500/20 bg-red-900/10">
                <h3 className="text-red-500 font-black flex items-center gap-2 mb-2"><Shield size={18}/> ERROR DE DESPLIEGUE</h3>
                <p className="text-sm font-mono text-red-200/70 mb-6">{error}</p>
                <Link to="/tops" className="text-xs uppercase font-black text-aeterium-gold tracking-widest hover:underline flex items-center gap-1">
                    <ArrowLeft size={14}/> Volver al Listado de Tops
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <Link to="/tops" className="text-xs uppercase font-black text-slate-500 hover:text-aeterium-gold tracking-widest flex items-center gap-1 mb-8 w-fit transition-colors">
                <ArrowLeft size={14}/> Volver al Listado
            </Link>

            <header className="guerrilla-card flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 border-l-aeterium-gold">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                        Sala de Guerra
                        <span className="bg-aeterium-gold/10 border border-aeterium-gold/20 text-aeterium-gold px-3 py-1 rounded text-[10px] uppercase font-mono tracking-[0.2em]">ACTIVO</span>
                    </h1>
                    <p className="text-sm text-slate-400 mt-2 font-mono">{top?.name || id}</p>
                </div>
                <div className="flex flex-wrap items-center gap-6">
                    <div className="text-center min-w-[100px] border-r border-white/5 pr-6 last:border-0 last:pr-0">
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Generación</div>
                        <div className="font-mono text-white text-xs mt-1">{formatDate(top?.created_at)}</div>
                    </div>
                    <div className="text-center min-w-[80px] border-r border-white/5 pr-6 last:border-0 last:pr-0">
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Nodos</div>
                        <div className="font-mono text-aeterium-gold text-lg mt-0.5">{products.length}</div>
                    </div>
                    <div className="text-center min-w-[120px]">
                        <div className="text-[10px] text-aeterium-gold uppercase tracking-widest font-bold">Efectivo Total</div>
                        <div className="font-mono text-white text-lg mt-0.5">€{calculatePotentialMargin().toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Panel de Nodos Estratégicos (Lista de productos) */}
                <div className="lg:col-span-2 guerrilla-card">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
                        <Server size={16} className="text-aeterium-gold"/> Top Value Nodes
                    </h3>
                    
                    <div className="space-y-3">
                        {products.map((p, idx) => (
                            <div key={p.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-aeterium-gold/30 hover:bg-white/[0.04] transition-all group flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded bg-aeterium-black border border-white/10 flex items-center justify-center font-black text-aeterium-gold text-xs shadow-inner">
                                        #{idx + 1}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-200 line-clamp-1">{p.name}</h4>
                                        <div className="flex items-center gap-3 mt-1">
                                            <div className="text-[10px] font-mono text-slate-500 uppercase">ID: {p.product_id}</div>
                                            <div className="text-[10px] font-mono text-aeterium-gold/60 uppercase">CAT: {p.category || '—'}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 text-right shrink-0">
                                   <div>
                                       <div className="text-[10px] text-slate-500 tracking-widest uppercase mb-0.5">Stock</div>
                                       <div className="text-xs font-mono font-bold text-emerald-400">{parseInt(p.stock) || 0}</div>
                                   </div>
                                   <div>
                                       <div className="text-[10px] text-aeterium-gold tracking-widest uppercase mb-0.5">Margen</div>
                                       <div className="text-sm font-mono font-black text-white">€{parseFloat(p.margin || 0).toFixed(2)}</div>
                                   </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Placeholder IA */}
                <div className="guerrilla-card border-none bg-gradient-to-b from-white/5 to-transparent relative overflow-hidden flex flex-col min-h-[400px]">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <Terminal size={120} />
                    </div>
                    
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2 mb-6 text-aeterium-gold">
                        <Zap size={16}/> Comandante IA
                    </h3>
                    
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 px-4">
                        <div className="p-4 bg-aeterium-black rounded-xl border border-white/5 shadow-2xl relative">
                            <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></span>
                            <Zap size={24} className="text-aeterium-gold animate-pulse" />
                        </div>
                        <div>
                            <p className="text-xs font-mono tracking-widest uppercase text-slate-400 mb-2">Módulo de Estrategia IA</p>
                            <span className="text-[9px] bg-red-500/10 px-2 py-0.5 border border-red-500/20 rounded text-red-400 font-bold uppercase tracking-tighter italic">En Construcción</span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono max-w-[240px] leading-relaxed italic">
                            “Próxima fase: integración con Gemini para tácticas personalizadas sobre estos nodos tácticos.”
                        </p>
                        <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                            <div className="bg-aeterium-gold h-full animate-[loading_2s_ease-in-out_infinite]" style={{ width: '40%' }}></div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
