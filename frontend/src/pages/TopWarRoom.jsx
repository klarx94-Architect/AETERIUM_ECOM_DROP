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

            <div className="flex flex-col gap-8">
                
                {/* Panel de Nodos Estratégicos (Tarjetas Horizontales Flotantes) */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-sm font-black uppercase tracking-[0.3em] flex items-center gap-2 text-white/50">
                            <Server size={14} className="text-aeterium-gold"/> Nodos de Valor
                        </h3>
                        <span className="text-[10px] font-mono text-slate-500 uppercase">{products.length} Activos</span>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/10 snap-x">
                        {products.map((p, idx) => (
                            <div key={p.id} className="min-w-[280px] md:min-w-[320px] snap-center p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-aeterium-gold/40 hover:bg-white/[0.06] transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Zap size={40} className="text-aeterium-gold" />
                                </div>
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-aeterium-black border border-white/10 flex items-center justify-center font-black text-aeterium-gold text-xs">
                                        #{idx + 1}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[9px] text-slate-500 tracking-widest uppercase mb-0.5 font-bold">Preview</div>
                                        <div className="text-[10px] font-mono text-emerald-400">STOCK {parseInt(p.stock) || 0}</div>
                                    </div>
                                </div>
                                <h4 className="text-sm font-bold text-white mb-4 line-clamp-2 h-10 leading-relaxed">{p.name}</h4>
                                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                    <div className="text-[10px] font-mono text-slate-500 uppercase truncate max-w-[120px]">{p.category || 'General'}</div>
                                    <div className="text-right">
                                        <div className="text-[9px] text-aeterium-gold uppercase font-bold">Margen Sugerido</div>
                                        <div className="text-base font-mono font-black text-white">€{parseFloat(p.margin || 0).toFixed(2)}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Panel Comandante IA (Cuadrícula de Chat Expansiva) */}
                <div className="guerrilla-card border-none bg-white/[0.02] backdrop-blur-md relative overflow-hidden flex flex-col min-h-[600px] shadow-2xl">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-aeterium-gold/5 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-aeterium-gold/10 rounded-xl border border-aeterium-gold/20">
                                <Terminal size={20} className="text-aeterium-gold" />
                            </div>
                            <div>
                                <h3 className="text-base font-black uppercase tracking-[0.2em] text-white">
                                    Comandante Táctico
                                </h3>
                                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-0.5">IA DE OPERACIONES ESTRATÉGICAS</p>
                            </div>
                        </div>
                        {aiState.content && (
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => copyToClipboard(aiState.content)}
                                    className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-300 hover:text-white uppercase tracking-widest transition-all border border-white/5"
                                >
                                    Copiar Plan de Vuelo
                                </button>
                                <button 
                                    onClick={handleGenerateTopStrategy}
                                    className="p-2 rounded-lg bg-aeterium-gold/10 text-aeterium-gold hover:bg-aeterium-gold hover:text-aeterium-black transition-all border border-aeterium-gold/20"
                                    title="Regenerar Inteligencia"
                                >
                                    <Zap size={18} />
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex-1 flex flex-col">
                        {!aiState.content && !aiState.loading && !aiState.error && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in duration-700">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-aeterium-gold/20 rounded-full blur-2xl animate-pulse"></div>
                                    <div className="relative p-8 bg-aeterium-black rounded-full border border-aeterium-gold/30 shadow-2xl">
                                        <Zap size={48} className="text-aeterium-gold" />
                                    </div>
                                </div>
                                <div className="space-y-3 max-w-sm">
                                    <h4 className="text-lg font-black uppercase tracking-widest text-white">Protocolo IA en Espera</h4>
                                    <p className="text-xs text-slate-400 font-mono leading-relaxed">
                                        Analiza la combinación táctica de estos {products.length} productos para desplegar una estrategia de alta conversión.
                                    </p>
                                </div>
                                <button 
                                    onClick={handleGenerateTopStrategy}
                                    className="px-10 py-4 bg-aeterium-gold text-aeterium-black font-black text-xs uppercase tracking-[0.2em] rounded-xl hover:scale-105 active:scale-95 transition-all shadow-gold"
                                >
                                    Generar Estrategia Maestra
                                </button>
                            </div>
                        )}

                        {aiState.loading && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in duration-500">
                                <div className="relative w-24 h-24">
                                    <div className="absolute inset-0 border-4 border-aeterium-gold/10 rounded-full"></div>
                                    <div className="absolute inset-0 border-4 border-t-aeterium-gold rounded-full animate-spin"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Zap size={32} className="text-aeterium-gold animate-pulse" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm font-black text-white uppercase tracking-[0.3em]">Sistema Aeterium En proceso</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Enlazando vectores de mercado y stock en tiempo real</p>
                                </div>
                            </div>
                        )}

                        {aiState.error && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-red-500/5 rounded-2xl border border-red-500/10 animate-in shake duration-500">
                                <div className="p-5 bg-red-500/10 rounded-full border border-red-500/20 mb-6">
                                    <ShieldAlert size={40} className="text-red-500" />
                                </div>
                                <h4 className="text-red-500 font-black text-sm uppercase tracking-widest mb-3">Interrupción Estratégica</h4>
                                <p className="text-xs text-red-200/60 font-mono mb-8 max-w-md mx-auto">{aiState.error}</p>
                                <button 
                                    onClick={handleGenerateTopStrategy}
                                    className="px-6 py-3 bg-white/5 hover:bg-white/10 text-xs font-black text-white rounded-xl uppercase tracking-widest transition-all border border-white/10"
                                >
                                    Reintentar Despliegue
                                </button>
                            </div>
                        )}

                        {aiState.content && (
                            <div className="flex-1 flex flex-col animate-in slide-in-from-bottom-8 fade-in duration-1000">
                                <div className="flex-1 bg-white/[0.01] rounded-2xl border border-white/5 p-8 overflow-hidden flex flex-col shadow-inner">
                                    <div className="flex-1 overflow-y-auto pr-4 custom-tactical-scroll">
                                        <div className="max-w-4xl mx-auto prose prose-invert prose-sm font-mono leading-loose text-slate-300 strategy-display">
                                            {aiState.content.split('\n').map((line, i) => {
                                                if (line.startsWith('##')) return (
                                                    <h4 key={i} className="text-aeterium-gold font-black mt-10 mb-6 uppercase tracking-[0.2em] border-l-4 border-aeterium-gold pl-4 bg-aeterium-gold/5 py-3 rounded-r-lg shadow-sm">
                                                        {line.replace('##', '').trim()}
                                                    </h4>
                                                );
                                                if (line.trim().startsWith('-')) return <li key={i} className="mb-2 list-none flex gap-3 text-white/80"><span className="text-aeterium-gold shrink-0">◢</span> {line.replace('-', '').trim()}</li>;
                                                if (!line.trim()) return <br key={i} />;
                                                return <p key={i} className="mb-4 text-[13px]">{line}</p>;
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
