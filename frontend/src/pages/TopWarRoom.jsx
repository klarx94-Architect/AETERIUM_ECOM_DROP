import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { Shield, Loader2, ArrowLeft, Terminal, Server, Zap, ShieldAlert } from 'lucide-react';

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

    const [aiState, setAiState] = useState({
        loading: false,
        error: '',
        content: ''
    });

    useEffect(() => {
        if (!supabase) {
            setError("No se detectó configuración de Supabase (VITE_SUPABASE_URL / ANON_KEY en el frontend).");
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
                    .maybeSingle();
                
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

    const handleGenerateTopStrategy = async () => {
        setAiState({ loading: true, error: '', content: '' });
        try {
            const res = await fetch('/api/strategy-for-top', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ top_id: id })
            });

            let data;
            try {
                data = await res.json();
            } catch (err) {
                setAiState({
                    loading: false,
                    error: 'Respuesta inesperada del servidor IA.',
                    content: ''
                });
                return;
            }

            if (!res.ok) {
                setAiState({
                    loading: false,
                    error: data.error || `Error del servidor (${res.status}).`,
                    content: ''
                });
                return;
            }

            if (data.success === false) {
                setAiState({
                    loading: false,
                    error: data.error || 'La IA no pudo procesar la estrategia en este momento.',
                    content: ''
                });
                return;
            }

            // Verificación defensiva del contenido
            const strategyContent = data.strategy || '';
            if (!strategyContent) {
                setAiState({
                    loading: false,
                    error: 'La IA devolvió una respuesta vacía.',
                    content: ''
                });
                return;
            }

            setAiState({
                loading: false,
                error: '',
                content: strategyContent
            });

        } catch (err) {
            setAiState({
                loading: false,
                error: 'Error de conexión con el centro táctico IA.',
                content: ''
            });
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert("Estrategia copiada al portapapeles táctico.");
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

                {/* Panel Comandante IA Interactiva */}
                <div className="guerrilla-card border-none bg-gradient-to-b from-white/5 to-transparent relative overflow-hidden flex flex-col min-h-[500px]">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <Terminal size={120} />
                    </div>
                    
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2 text-aeterium-gold">
                            <Zap size={16}/> Comandante IA
                        </h3>
                        {aiState.content && (
                            <button 
                                onClick={() => copyToClipboard(aiState.content)}
                                className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-tighter transition-colors border-b border-white/10"
                            >
                                Copiar Estrategia
                            </button>
                        )}
                    </div>
                    
                    <div className="flex-1 flex flex-col">
                        {!aiState.content && !aiState.loading && !aiState.error && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                                <div className="p-6 bg-aeterium-black rounded-full border border-aeterium-gold/20 shadow-2xl relative">
                                    <Zap size={32} className="text-aeterium-gold" />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-white font-black uppercase text-xs tracking-widest">Inteligencia Pendiente</h4>
                                    <p className="text-[10px] text-slate-500 font-mono max-w-[200px] leading-relaxed">
                                        Genera un plan de despliegue táctico basado en los {products.length} productos de este top.
                                    </p>
                                </div>
                                <button 
                                    onClick={handleGenerateTopStrategy}
                                    className="px-6 py-3 bg-aeterium-gold text-aeterium-black font-black text-[10px] uppercase tracking-widest rounded-lg hover:bg-white transition-all shadow-gold"
                                >
                                    Generar Estrategia IA
                                </button>
                            </div>
                        )}

                        {aiState.loading && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                                <Loader2 size={40} className="animate-spin text-aeterium-gold" />
                                <div className="space-y-1">
                                    <p className="text-xs font-mono text-white animate-pulse">Sincronizando con Gemini 1.5...</p>
                                    <p className="text-[9px] text-slate-500 uppercase tracking-tighter">Procesando vectores de margen y stock</p>
                                </div>
                            </div>
                        )}

                        {aiState.error && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-red-500/5 rounded-xl border border-red-500/20">
                                < ShieldAlert size={32} className="text-red-500 mb-4" />
                                <h4 className="text-red-500 font-black text-xs uppercase mb-2">Error Táctico</h4>
                                <p className="text-[10px] text-red-200/60 font-mono mb-6">{aiState.error}</p>
                                <button 
                                    onClick={handleGenerateTopStrategy}
                                    className="text-[10px] font-black text-white hover:text-aeterium-gold underline uppercase"
                                >
                                    Reintentar Conexión
                                </button>
                            </div>
                        )}

                        {aiState.content && (
                            <div className="flex-1 bg-aeterium-black/40 rounded-xl border border-white/5 p-6 overflow-hidden flex flex-col relative group">
                                <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                                    <div className="prose prose-invert prose-xs font-mono text-[11px] leading-relaxed strategy-content">
                                        {aiState.content.split('\n').map((line, i) => {
                                            if (line.startsWith('##')) return <h4 key={i} className="text-aeterium-gold font-black mt-4 mb-2 uppercase tracking-wide border-b border-aeterium-gold/10 pb-1">{line.replace('##', '')}</h4>;
                                            return <p key={i} className="mb-2 text-slate-300">{line}</p>;
                                        })}
                                    </div>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-aeterium-black to-transparent pointer-events-none opacity-50"></div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
