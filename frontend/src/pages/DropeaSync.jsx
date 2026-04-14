import React, { useState } from 'react';
import { Send, AlertCircle, CheckCircle2, Loader2, Database, User, Phone, MapPin, Package } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function DropeaSync() {
    const [formData, setFormData] = useState({
        name: '', phone: '', address: '', payment: 'COD', productId: ''
    });
    const [status, setStatus] = useState({ state: 'idle', message: '' });

    const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ state: 'loading', message: 'Sincronizando orden con la infraestructura Dropea...' });
        try {
            const res = await fetch(`${API_BASE}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.success) {
                setStatus({ state: 'success', message: `${data.message}` });
                setFormData({name: '', phone: '', address: '', payment: 'COD', productId: ''});
            } else {
                setStatus({ state: 'error', message: `${data.error}` });
            }
        } catch (err) {
            setStatus({ state: 'error', message: 'Servidor inaccesible. Verificación de túnel requerida.' });
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <section className="guerrilla-card overflow-hidden">
                <div className="mb-8 border-b border-white/5 pb-6">
                    <div className="flex items-center gap-3 mb-2">
                       <span className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500 border border-emerald-500/20">
                          <Database size={20} />
                       </span>
                       <h3 className="text-xl font-black text-white tracking-tight">Sincronización de Órdenes</h3>
                    </div>
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">Registro de venta manual • Nodo de Despliegue Dropea</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                               <User size={12} className="text-aeterium-gold" /> Cliente Final
                            </label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} required
                                placeholder="Nombre completo"
                                className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white focus:border-aeterium-gold/50 outline-none transition-all placeholder:text-slate-700" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                               <Phone size={12} className="text-aeterium-gold" /> Teléfono
                            </label>
                            <input type="text" name="phone" value={formData.phone} onChange={handleChange} required
                                placeholder="+34 000 000 000"
                                className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white focus:border-aeterium-gold/50 outline-none transition-all placeholder:text-slate-700" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                           <MapPin size={12} className="text-aeterium-gold" /> Dirección Tactica
                        </label>
                        <input type="text" name="address" value={formData.address} onChange={handleChange} required
                            placeholder="Calle, Número, Piso, Ciudad..."
                            className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white focus:border-aeterium-gold/50 outline-none transition-all placeholder:text-slate-700" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Método de Liquidez</label>
                            <select name="payment" value={formData.payment} onChange={handleChange}
                                className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white focus:border-aeterium-gold/50 outline-none transition-all appearance-none cursor-pointer">
                                <option value="COD" className="bg-aeterium-black">Contra Reembolso (COD)</option>
                                <option value="Transfer" className="bg-aeterium-black">Transferencia Bancaria</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                               <Package size={12} className="text-aeterium-gold" /> ID Producto
                            </label>
                            <input type="text" name="productId" value={formData.productId} onChange={handleChange} required
                                placeholder="ID Dropea"
                                className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm font-mono text-aeterium-gold focus:border-aeterium-gold outline-none transition-all placeholder:text-slate-700" />
                        </div>
                    </div>

                    {status.state !== 'idle' && (
                        <div className={`p-5 rounded-xl border flex items-start gap-4 animate-in zoom-in-95 duration-300 ${
                            status.state === 'success' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' :
                            status.state === 'error' ? 'bg-red-500/5 border-red-500/20 text-red-400' :
                            'bg-white/5 border-white/10 text-slate-400'
                        }`}>
                            <div className="mt-1">
                                {status.state === 'success' && <CheckCircle2 size={20} />}
                                {status.state === 'error' && <AlertCircle size={20} />}
                                {status.state === 'loading' && <Loader2 size={20} className="animate-spin" />}
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">
                                    {status.state === 'success' ? 'Enlace Establecido' : status.state === 'error' ? 'Sincronización Fallida' : 'Transmitiendo Datos'}
                                </h4>
                                <p className="text-xs font-mono opacity-80">{status.message}</p>
                            </div>
                        </div>
                    )}

                    <div className="pt-8 border-t border-white/5 flex justify-end">
                        <button type="submit" disabled={status.state === 'loading'}
                            className="intel-gradient px-10 py-3 rounded-xl text-aeterium-black text-xs font-black uppercase tracking-widest flex items-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-gold disabled:opacity-50">
                            {status.state === 'loading' ? <Loader2 size={18} className="animate-spin"/> : <Send size={18} />}
                            {status.state === 'loading' ? 'Integrando...' : 'Desplegar Orden'}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}
