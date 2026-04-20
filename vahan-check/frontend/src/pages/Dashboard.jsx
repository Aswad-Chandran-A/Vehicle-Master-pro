// pages/Dashboard.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Truck, AlertTriangle, CheckCircle, XCircle, TrendingUp, RefreshCw, Download } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { getDashboard, getVehicles, exportCsv } from '../services/api'
import { StatusBadge, PageLoader } from '../components/UI'
import { formatDate, daysLabel, daysColor } from '../utils/compliance'

const KPI = ({ label, value, icon: Icon, color, sub }) => (
  <div className="card p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color.replace('text-', 'bg-').replace('400', '500/15')}`}>
        <Icon size={18} className={color} />
      </div>
    </div>
  </div>
)

export default function Dashboard() {
  const [kpis,     setKpis]     = useState(null)
  const [vehicles, setVehicles] = useState([])
  const [forecast, setForecast] = useState(null)
  const [docDist,  setDocDist]  = useState(null)
  const [loading,  setLoading]  = useState(true)

  async function load() {
    setLoading(true)
    try {
      const [d, v] = await Promise.all([getDashboard(), getVehicles({ limit: 8 })])
      setKpis(d.data.data.kpis)
      setForecast(d.data.data.forecast)
      setDocDist(d.data.data.docDistribution)
      setVehicles(v.data.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function handleExport() {
    const r = await exportCsv({})
    const url = URL.createObjectURL(new Blob([r.data]))
    const a = document.createElement('a'); a.href = url; a.download = 'fleet-report.csv'; a.click()
  }

  if (loading) return <PageLoader />

  const forecastData = forecast ? [
    { name: 'Week 1', docs: forecast.week1 },
    { name: 'Week 2', docs: forecast.week2 },
    { name: 'Week 3', docs: forecast.week3 },
    { name: 'Week 4', docs: forecast.week4 },
  ] : []

  const pieData = docDist ? Object.entries(docDist).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value })) : []
  const PIE_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981']

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Fleet Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Real-time compliance overview</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary flex items-center gap-2">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={handleExport} className="btn-primary flex items-center gap-2">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Total Fleet"      value={kpis?.total   ?? 0} icon={Truck}         color="text-slate-300"  sub="registered vehicles" />
        <KPI label="Compliant"        value={kpis?.green   ?? 0} icon={CheckCircle}   color="text-emerald-400" sub={`${kpis?.compliance_pct ?? 0}% compliance rate`} />
        <KPI label="Expiring Soon"    value={kpis?.yellow  ?? 0} icon={AlertTriangle} color="text-amber-400"   sub="within 15 days" />
        <KPI label="Expired / At Risk"value={kpis?.red     ?? 0} icon={XCircle}       color="text-red-400"     sub="immediate action needed" />
      </div>

      {/* Compliance gauge */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Overall Compliance Rate</p>
            <p className="text-2xl font-bold text-white mt-0.5">{kpis?.compliance_pct ?? 0}%</p>
          </div>
          <TrendingUp size={20} className="text-brand-400" />
        </div>
        <div className="h-3 bg-surface-hover rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-600 to-emerald-500 rounded-full transition-all duration-700"
            style={{ width: `${kpis?.compliance_pct ?? 0}%` }}
          />
        </div>
        <div className="flex gap-4 mt-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Compliant: {kpis?.green}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />Expiring: {kpis?.yellow}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Expired: {kpis?.red}</span>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 30-day forecast */}
        <div className="card p-5">
          <p className="text-sm font-semibold text-slate-200 mb-4">30-Day Expiry Forecast</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={forecastData} barSize={28}>
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#161b27', border: '1px solid #222840', borderRadius: 8, fontSize: 12 }}
                cursor={{ fill: '#1e2438' }}
              />
              <Bar dataKey="docs" name="Documents Expiring" fill="#2f74ff" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Doc distribution pie */}
        <div className="card p-5">
          <p className="text-sm font-semibold text-slate-200 mb-4">At-Risk by Document Type</p>
          {pieData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="60%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#161b27', border: '1px solid #222840', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-slate-400">{d.name}</span>
                    <span className="text-slate-200 font-medium ml-auto">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-500 text-sm">All documents compliant ✓</div>
          )}
        </div>
      </div>

      {/* Recent vehicles */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <p className="text-sm font-semibold text-slate-200">Fleet Overview</p>
          <Link to="/vehicles" className="text-xs text-brand-400 hover:text-brand-300">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border">
                {['Reg Number','Make / Model','Insurance','PUC','Fitness','Status',''].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vehicles.map(v => {
                const dm = v.compliance?.daysMap || {}
                return (
                  <tr key={v.id} className="border-b border-surface-border/50 hover:bg-surface-hover transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs font-medium text-slate-200">{v.reg_number}</td>
                    <td className="px-5 py-3.5 text-slate-300 whitespace-nowrap">{v.make} {v.model}</td>
                    <td className={`px-5 py-3.5 text-xs font-medium ${daysColor(dm.INS)}`}>{daysLabel(dm.INS)}</td>
                    <td className={`px-5 py-3.5 text-xs font-medium ${daysColor(dm.PUC)}`}>{daysLabel(dm.PUC)}</td>
                    <td className={`px-5 py-3.5 text-xs font-medium ${daysColor(dm.FIT)}`}>{daysLabel(dm.FIT)}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={v.compliance?.overall} /></td>
                    <td className="px-5 py-3.5">
                      <Link to={`/vehicles/${v.id}`} className="text-xs text-brand-400 hover:text-brand-300">View →</Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}