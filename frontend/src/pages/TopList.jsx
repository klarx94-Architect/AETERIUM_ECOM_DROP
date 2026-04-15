import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { Sparkles, Loader2, ArrowRight, Calendar, Info, ShieldAlert } from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export default function TopList() {
    const navigate = useNavigate();
    const [tops, setTops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!supabase) {
            setError("Configuración de Supabase no detectada en el cliente.");
            setLoading(false);
            return;
        }

        async function fetchTops() {
            try {
                const { data, error } = await supabase
                    .from('tops')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setTops(data || []);
            } catch (err) {
                console.error("Error cargando tops:", err);
                setError("No se pudieron recuperar las estrategias de la base de datos.");
            } finally {
                setLoading(false);
            }
        }

        fetchTops();
    }, []);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-40 animate-in fade-in duration-500">
                <Loader2 size={40} className="animate-spin text-aeterium-gold mb-4" />
                <p className="text-xs font-mono uppercase tracking-[0.2em] text-slate-500">Sincronizando Archivos de Inteligencia...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <header>
                <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                    Historial de Estrategias
                    <Sparkles className="text-aeterium-gold" size={24} />
                </h1>
                <p className="text-slate-400 mt-2 max-w-2xl text-sm">
                    Accede a las salas de guerra generadas previamente. Cada Top representa un nodo de inteligencia táctica único.
                </p>
            </header>

            {error ? (
                <div className="guerrilla-card border-red-500/20 bg-red-900/5 flex items-center gap-4 p-6">
                    <ShieldAlert className="text-red-500 shrink-0" size={24} />
                    <div>
                        <h4 className="text-red-500 font-bold text-sm">Fallo de Enlace de Datos</h4>
                        <p className="text-xs text-red-200/60 mt-1 font-mono">{error}</p>
                    </div>
                </div>
            ) : tops.length === 0 ? (
                <div className="guerrilla-card flex flex-col items-center justify-center py-20 text-center border-dashed">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                        <Info className="text-slate-500" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Sin estrategias activas</h3>
                    <p className="text-slate-500 text-sm max-w-xs mb-8">
                        Aún no has generado ningún Top por margen. Ve a Guerrilla Intel para iniciar una operación.
                    </p>
                    <button 
                        onClick={() => navigate('/')}
                        className="px-6 py-3 bg-aeterium-gold text-aeterium-black font-black text-xs uppercase tracking-widest rounded-lg hover:bg-white transition-all shadow-gold"
                    >
                        Iniciar Nueva Operación
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tops.map((top) => (
                        <div 
                            key={top.id}
                            className="guerrilla-card group hover:border-aeterium-gold/40 transition-all cursor-pointer relative overflow-hidden"
                            onClick={() => navigate(`/top/${top.id}`)}
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
                                <Sparkles size={80} />
                            </div>
                            
                            <div className="flex justify-between items-start mb-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono text-aeterium-gold uppercase tracking-[0.2em] bg-aeterium-gold/10 px-2 py-0.5 rounded border border-aeterium-gold/20">
                                            {top.type || 'Manual'}
                                        </span>
                                        <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-[0.2em] bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
                                            {top.status || 'Active'}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-black text-white group-hover:text-aeterium-gold transition-colors truncate">
                                        {top.name}
                                    </h3>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5">
                                <div className="flex items-center gap-2 text-slate-500 font-mono text-[10px]">
                                    <Calendar size={12} />
                                    {formatDate(top.created_at)}
                                </div>
                                <div className="flex items-center gap-2 text-aeterium-gold font-black text-[10px] uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                                    War Room <ArrowRight size={14} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
