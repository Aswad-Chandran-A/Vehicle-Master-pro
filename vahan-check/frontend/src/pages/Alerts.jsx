// pages/Alerts.jsx
import { useEffect, useState } from 'react'
import { getNotifLogs } from '../services/api'
import { PageLoader, Empty } from '../components/UI'
import { Bell } from 'lucide-react'

export default function Alerts() {
  const [logs,    setLogs]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getNotifLogs().then(r => setLogs(r.data.data)).finally(() => setLoading(false))
  }, [])

  const STATUS_COLOR = { sent: 'text-emerald-400', failed: 'text-red-400', pending: 'text-amber-400' }
  const CHAN_ICON = { email: '📧', whatsapp: '📱', sms: '💬', push: '🔔' }

  if (loading) return <PageLoader />

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Alert Logs</h1>
        <p className="text-slate-400 text-sm mt-0.5">History of all compliance notifications sent</p>
      </div>
      {logs.length === 0 ? (
        <Empty icon={Bell} title="No alerts sent yet" desc="Alerts are triggered automatically by the daily cron job" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border">
                {['Vehicle','Document','Channel','Recipient','T-Minus','Status','Date'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map(n => (
                <tr key={n.id} className="border-b border-surface-border/40 hover:bg-surface-hover transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-200">{n.reg_number || `#${n.vehicle_id}`}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-400">{n.doc_type}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-400">{CHAN_ICON[n.channel]} {n.channel}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-400 max-w-[160px] truncate">{n.recipient}</td>
                  <td className="px-5 py-3.5 text-xs font-mono text-slate-400">{n.days_before !== null ? `T-${n.days_before}` : '—'}</td>
                  <td className={`px-5 py-3.5 text-xs font-semibold ${STATUS_COLOR[n.status] || 'text-slate-400'}`}>{n.status}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-500">{n.created_at ? new Date(n.created_at).toLocaleString('en-IN') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}