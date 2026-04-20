// pages/Reports.jsx
import { useState, useEffect } from 'react'
import { Download, BarChart2, Bell, FileText } from 'lucide-react'
import { getDashboard, exportCsv, getNotifLogs } from '../services/api'
import { PageLoader, useToast, ToastContainer } from '../components/UI'

export default function Reports() {
  const [dash,   setDash]   = useState(null)
  const [notifs, setNotifs] = useState([])
  const [loading,setLoading]= useState(true)
  const [filter, setFilter] = useState({ status: '', start_date: '', end_date: '' })
  const { toast, toasts }   = useToast()

  useEffect(() => {
    Promise.all([getDashboard(), getNotifLogs()])
      .then(([d, n]) => { setDash(d.data.data); setNotifs(n.data.data) })
      .finally(() => setLoading(false))
  }, [])

  async function handleExport() {
    try {
      const r   = await exportCsv(filter)
      const url = URL.createObjectURL(new Blob([r.data], { type: 'text/csv' }))
      const a   = document.createElement('a'); a.href = url; a.download = `fleet-report-${Date.now()}.csv`; a.click()
      toast('Report downloaded ✓')
    } catch { toast('Export failed', 'error') }
  }

  if (loading) return <PageLoader />

  const STATUS_CHAN = { sent: 'text-emerald-400', failed: 'text-red-400', pending: 'text-amber-400', retrying: 'text-amber-400' }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <ToastContainer toasts={toasts} />
      <div>
        <h1 className="text-xl font-bold text-white">Reports & Analytics</h1>
        <p className="text-slate-400 text-sm mt-0.5">Export fleet data and view notification history</p>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Fleet',    value: dash?.kpis?.total,          color: 'text-slate-300' },
          { label: 'Compliance %',   value: `${dash?.kpis?.compliance_pct ?? 0}%`, color: 'text-brand-400' },
          { label: 'At Risk',        value: dash?.kpis?.yellow,         color: 'text-amber-400' },
          { label: 'Expired',        value: dash?.kpis?.red,            color: 'text-red-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value ?? 0}</p>
          </div>
        ))}
      </div>

      {/* CSV Export */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Download size={16} className="text-brand-400" />
          <p className="text-sm font-semibold text-slate-200">Export Fleet Report (CSV)</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Filter by Status</label>
            <select className="input" value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
              <option value="">All vehicles</option>
              <option value="green">Compliant only</option>
              <option value="yellow">Expiring only</option>
              <option value="red">Expired only</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">From Date</label>
            <input type="date" className="input" value={filter.start_date} onChange={e => setFilter(f => ({ ...f, start_date: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">To Date</label>
            <input type="date" className="input" value={filter.end_date} onChange={e => setFilter(f => ({ ...f, end_date: e.target.value }))} />
          </div>
        </div>
        <button onClick={handleExport} className="btn-primary flex items-center gap-2">
          <Download size={14} /> Download CSV Report
        </button>
        <p className="text-[10px] text-slate-600 mt-2">Report includes system-generated footer with timestamp and data source.</p>
      </div>

      {/* Notification history */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-surface-border">
          <Bell size={15} className="text-brand-400" />
          <p className="text-sm font-semibold text-slate-200">Notification Log</p>
          <span className="ml-auto text-xs text-slate-500">{notifs.length} entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border">
                {['Vehicle','Doc Type','Channel','Recipient','Status','Days Before','Sent At'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {notifs.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500 text-sm">No notifications sent yet</td></tr>
              ) : notifs.map(n => (
                <tr key={n.id} className="border-b border-surface-border/40 hover:bg-surface-hover transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-300">{n.reg_number || n.vehicle_id}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{n.doc_type}</td>
                  <td className="px-4 py-3 text-xs text-slate-400 capitalize">{n.channel}</td>
                  <td className="px-4 py-3 text-xs text-slate-400 max-w-[160px] truncate">{n.recipient}</td>
                  <td className="px-4 py-3 text-xs font-medium"><span className={STATUS_CHAN[n.status] || 'text-slate-400'}>{n.status}</span></td>
                  <td className="px-4 py-3 text-xs text-slate-400">{n.days_before !== null ? `T-${n.days_before}` : '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{n.sent_at ? new Date(n.sent_at).toLocaleString('en-IN') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}