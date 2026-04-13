import React, { useState } from 'react';
import { Send, AlertCircle, CheckCircle2, Loader2, User, Phone, MapPin, CreditCard, Hash } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function DropeaSync() {
  const [formData, setFormData] = useState({
    name: '', phone: '', address: '', payment: 'COD', productId: ''
  });
  const [status, setStatus] = useState({ state: 'idle', message: '' });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

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
        setStatus({ state: 'success', message: data.message });
        setFormData({ name: '', phone: '', address: '', payment: 'COD', productId: '' });
      } else {
        setStatus({ state: 'error', message: data.error });
      }
    } catch (err) {
      setStatus({ state: 'error', message: 'Servidor inaccesible. Verifica Railway.' });
    }
  };

  const fields = [
    { name: 'name',      label: 'Nombre Completo',      icon: User,       type: 'text',   placeholder: 'Juan García López',           col: 1 },
    { name: 'phone',     label: 'Teléfono',              icon: Phone,      type: 'tel',    placeholder: '+34 612 345 678',             col: 1 },
    { name: 'address',   label: 'Dirección Exacta',      icon: MapPin,     type: 'text',   placeholder: 'Calle Gran Vía 12, 3B, Madrid', col: 2 },
    { name: 'productId', label: 'Product ID (Dropea)',   icon: Hash,       type: 'text',   placeholder: '1459',                        col: 1, mono: true },
  ];

  const statusConfig = {
    success: { bg: 'bg-phantom-green-dim', border: 'border-green-800/30', text: 'text-phantom-green', icon: CheckCircle2, title: 'Mutación Completada' },
    error:   { bg: 'bg-phantom-red-dim',   border: 'border-red-800/30',   text: 'text-phantom-red',   icon: AlertCircle,  title: 'Error de Integración' },
    loading: { bg: 'bg-phantom-gold-dim',  border: 'border-amber-800/30', text: 'text-phantom-gold',  icon: Loader2,      title: 'Transfiriendo Payload' },
  };

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="phantom-card p-8 space-y-8">

        {/* Header */}
        <div className="border-b border-phantom-border pb-6">
          <h3 className="font-display text-lg font-bold text-phantom-text">Nueva Orden Manual</h3>
          <p className="text-sm text-phantom-muted mt-1">Registra ventas verificadas por Marketplace o WhatsApp.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* GRID 2 columnas para campos simples */}
          <div className="grid grid-cols-2 gap-5">
            {fields.filter(f => f.col === 1).map(({ name, label, icon: Icon, type, placeholder, mono }) => (
              <div key={name} className="space-y-2">
                <label className="phantom-label flex items-center gap-1.5">
                  <Icon size={11} className="text-phantom-gold" />
                  {label}
                </label>
                <input
                  type={type}
                  name={name}
                  value={formData[name]}
                  onChange={handleChange}
                  required
                  placeholder={placeholder}
                  className={`phantom-input ${mono ? 'font-mono' : ''}`}
                />
              </div>
            ))}
          </div>

          {/* Dirección — full width */}
          {fields.filter(f => f.col === 2).map(({ name, label, icon: Icon, type, placeholder }) => (
            <div key={name} className="space-y-2">
              <label className="phantom-label flex items-center gap-1.5">
                <Icon size={11} className="text-phantom-gold" />
                {label}
              </label>
              <input
                type={type}
                name={name}
                value={formData[name]}
                onChange={handleChange}
                required
                placeholder={placeholder}
                className="phantom-input"
              />
            </div>
          ))}

          {/* Método de Pago */}
          <div className="space-y-2">
            <label className="phantom-label flex items-center gap-1.5">
              <CreditCard size={11} className="text-phantom-gold" />
              Método de Pago
            </label>
            <select
              name="payment"
              value={formData.payment}
              onChange={handleChange}
              className="phantom-input"
            >
              <option value="COD">Contra Reembolso (COD)</option>
              <option value="Transfer">Transferencia Bancaria</option>
              <option value="Bizum">Bizum</option>
              <option value="PayPal">PayPal</option>
            </select>
          </div>

          {/* Status Banner */}
          {status.state !== 'idle' && (() => {
            const cfg = statusConfig[status.state];
            const Icon = cfg.icon;
            return (
              <div className={`${cfg.bg} border ${cfg.border} rounded-lg p-4 flex items-start gap-3`}>
                <Icon size={16} className={`${cfg.text} mt-0.5 flex-shrink-0 ${status.state === 'loading' ? 'animate-spin' : ''}`} />
                <div>
                  <p className={`text-xs font-bold font-mono uppercase tracking-wider ${cfg.text}`}>{cfg.title}</p>
                  <p className="text-sm text-phantom-text mt-0.5">{status.message}</p>
                </div>
              </div>
            );
          })()}

          {/* Submit */}
          <div className="pt-2 border-t border-phantom-border flex justify-end">
            <button
              type="submit"
              disabled={status.state === 'loading'}
              className="phantom-btn-primary"
            >
              {status.state === 'loading'
                ? <><Loader2 size={15} className="animate-spin" /> Integrando Orden...</>
                : <><Send size={15} /> Crear Orden en Dropea</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
