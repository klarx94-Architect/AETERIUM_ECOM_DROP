import React, { useState } from 'react';

export default function DropeaSyncForm() {
    const [formData, setFormData] = useState({
        name: '', phone: '', address: '', payment: 'COD', productId: ''
    });
    const [status, setStatus] = useState({ state: 'idle', message: '' });

    const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ state: 'loading', message: 'Ejecutando mutación hacia Dropea GraphQL...' });
        
        try {
            const res = await fetch('/api/order', {
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
            setStatus({ state: 'error', message: 'El servidor backend de AETERIUM está inaccesible.' });
        }
    };

    return (
        <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-slate-700">Nombre Completo</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-slate-700">Teléfono (WhatsApp)</label>
                        <input type="text" name="phone" value={formData.phone} onChange={handleChange} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Dirección Exacta</label>
                    <input type="text" name="address" value={formData.address} onChange={handleChange} required placeholder="Ej: Calle Principal 123, Madrid" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>

                <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-slate-700">Método de Pago</label>
                        <select name="payment" value={formData.payment} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                            <option value="COD">Pago Contra Reembolso</option>
                            <option value="BankTransfer">Transferencia / Bizum</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-slate-700">ID de Producto Dropea</label>
                        <input type="text" name="productId" value={formData.productId} onChange={handleChange} required placeholder="Ej: 1459" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                </div>

                <div className="pt-2 flex justify-end">
                    <button type="submit" disabled={status.state === 'loading'} className="w-full sm:w-auto px-8 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors">
                        {status.state === 'loading' ? 'Sincronizando...' : 'Procesar Orden Real'}
                    </button>
                </div>
            </form>

            {/* Notification Toast */}
            {status.state !== 'idle' && (
                <div className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
                    status.state === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                    status.state === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                    'bg-indigo-50 border-indigo-200 text-indigo-800'
                }`}>
                    <div className="mt-0.5 text-lg">
                        {status.state === 'success' && '✅'}
                        {status.state === 'error' && '❌'}
                        {status.state === 'loading' && '⚡'}
                    </div>
                    <div>
                        <h4 className="text-[13px] font-bold uppercase tracking-wider mb-0.5 mt-[2px]">
                            {status.state === 'success' ? 'Orden Registrada en Dropea' : status.state === 'error' ? 'Reporte de Mutación Fallida' : 'Comunicando con GraphQL API'}
                        </h4>
                        <p className="text-sm font-medium opacity-90">{status.message}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
