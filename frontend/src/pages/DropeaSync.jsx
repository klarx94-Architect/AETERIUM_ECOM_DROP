import React, { useState } from 'react';
import { Send, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

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
            setStatus({ state: 'error', message: 'Servidor inaccesible. Revisa VITE_API_URL en .env.' });
        }
    };

    return (
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-2xl">
            <div className="mb-8 border-b border-slate-100 pb-5">
                <h3 className="text-xl font-semibold text-slate-800">Sincronización de Órdenes</h3>
                <p className="text-sm text-slate-500 mt-1">Registrar venta manual verificada (Marketplace / WhatsApp).</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Nombre Completo</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required
                            className="w-full px-4 py-2.5 bg-[#FAFAFA] border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-slate-400 outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Teléfono</label>
                        <input type="text" name="phone" value={formData.phone} onChange={handleChange} required
                            className="w-full px-4 py-2.5 bg-[#FAFAFA] border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-slate-400 outline-none transition-all" />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Dirección Exacta</label>
                    <input type="text" name="address" value={formData.address} onChange={handleChange} required
                        placeholder="Ej: Calle Gran Vía 12, 3B, Madrid"
                        className="w-full px-4 py-2.5 bg-[#FAFAFA] border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-slate-400 outline-none transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Método de Pago</label>
                        <select name="payment" value={formData.payment} onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-[#FAFAFA] border border-slate-200 rounded-lg text-sm focus:bg-white outline-none transition-all">
                            <option value="COD">Contra Reembolso (COD)</option>
                            <option value="Transfer">Transferencia</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Product ID (Dropea)</label>
                        <input type="text" name="productId" value={formData.productId} onChange={handleChange} required
                            placeholder="Ej: 1459"
                            className="w-full px-4 py-2.5 bg-[#FAFAFA] border border-slate-200 rounded-lg text-sm font-mono focus:bg-white focus:ring-2 focus:ring-slate-400 outline-none transition-all" />
                    </div>
                </div>
                {status.state !== 'idle' && (
                    <div className={`p-4 rounded-lg border flex items-start gap-3 ${
                        status.state === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                        status.state === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                        'bg-slate-50 border-slate-200 text-slate-800'
                    }`}>
                        <div className="mt-0.5">
                            {status.state === 'success' && <CheckCircle2 size={18} className="text-emerald-600" />}
                            {status.state === 'error' && <AlertCircle size={18} className="text-red-600" />}
                            {status.state === 'loading' && <Loader2 size={18} className="animate-spin text-slate-600" />}
                        </div>
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider mb-1">
                                {status.state === 'success' ? 'Mutación Completada' : status.state === 'error' ? 'GraphQL Reject' : 'Transfiriendo Payload'}
                            </h4>
                            <p className="text-sm font-medium opacity-90">{status.message}</p>
                        </div>
                    </div>
                )}
                <div className="pt-6 border-t border-slate-100 flex justify-end">
                    <button type="submit" disabled={status.state === 'loading'}
                        className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-all shadow-sm">
                        {status.state === 'loading' ? <Loader2 size={16} className="animate-spin"/> : <Send size={16} />}
                        {status.state === 'loading' ? 'Integrando...' : 'Crear Orden en Dropea'}
                    </button>
                </div>
            </form>
        </section>
    );
}
