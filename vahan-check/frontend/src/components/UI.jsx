// components/UI.jsx — shared building blocks
import { useState } from 'react'
import { Loader2, X, AlertTriangle, CheckCircle, Info } from 'lucide-react'

/* ── Spinner ── */
export function Spinner({ size = 20 }) {
  return <Loader2 size={size} className="animate-spin text-brand-400" />
}

/* ── Full-page loader ── */
export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner size={28} />
    </div>
  )
}

/* ── Status badge ── */
export function StatusBadge({ status }) {
  const map = {
    green:       { cls: 'badge-green',  label: 'Compliant' },
    yellow:      { cls: 'badge-yellow', label: 'Expiring Soon' },
    red:         { cls: 'badge-red',    label: 'Expired' },
    blacklisted: { cls: 'badge-black',  label: 'Blacklisted' },
  }
  const { cls, label } = map[status] || map.yellow
  return <span className={cls}><span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />{label}</span>
}

/* ── Modal ── */
export function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className={`relative card p-6 w-full animate-slide-up max-h-[90vh] overflow-y-auto ${wide ? 'max-w-3xl' : 'max-w-lg'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-slate-100">{title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

/* ── Form field ── */
export function Field({ label, required, children, error }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  )
}

/* ── Alert banner ── */
export function Alert({ type = 'info', message }) {
  const styles = {
    info:    { cls: 'bg-brand-900/40 border-brand-700/40 text-brand-300',   Icon: Info },
    success: { cls: 'bg-emerald-900/40 border-emerald-700/40 text-emerald-300', Icon: CheckCircle },
    warning: { cls: 'bg-amber-900/40 border-amber-700/40 text-amber-300',   Icon: AlertTriangle },
    error:   { cls: 'bg-red-900/40 border-red-700/40 text-red-300',         Icon: AlertTriangle },
  }
  const { cls, Icon } = styles[type]
  return (
    <div className={`flex items-start gap-2.5 border rounded-lg px-4 py-3 text-sm ${cls}`}>
      <Icon size={16} className="mt-0.5 flex-shrink-0" />
      <span>{message}</span>
    </div>
  )
}

/* ── Empty state ── */
export function Empty({ icon: Icon, title, desc }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <Icon size={40} className="text-slate-600 mb-4" />}
      <p className="text-slate-400 font-medium">{title}</p>
      {desc && <p className="text-slate-600 text-sm mt-1">{desc}</p>}
    </div>
  )
}

/* ── Confirm dialog ── */
export function Confirm({ open, onClose, onConfirm, title, message, danger }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-slate-400 text-sm mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button onClick={onConfirm} className={danger ? 'btn-danger' : 'btn-primary'}>Confirm</button>
      </div>
    </Modal>
  )
}

/* ── Toast (simple in-app) ── */
export function useToast() {
  const [toasts, setToasts] = useState([])
  const add = (msg, type = 'success') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }
  return { toasts, toast: add }
}

export function ToastContainer({ toasts }) {
  const colors = { success: 'bg-emerald-900/90 border-emerald-600/40 text-emerald-200', error: 'bg-red-900/90 border-red-600/40 text-red-200', info: 'bg-brand-900/90 border-brand-600/40 text-brand-200' }
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id} className={`border rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg animate-slide-up ${colors[t.type] || colors.info}`}>
          {t.msg}
        </div>
      ))}
    </div>
  )
}