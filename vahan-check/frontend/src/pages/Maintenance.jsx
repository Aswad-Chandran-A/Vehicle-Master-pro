// pages/Maintenance.jsx
import { useEffect, useState } from 'react'
import { getDueMaint } from '../services/api'
import { PageLoader, Empty } from '../components/UI'
import { Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Maintenance() {
  const [logs,    setLogs]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDueMaint().then(r => setLogs(r.data.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Maintenance Tracker</h1>
        <p className="text-slate-400 text-sm mt-0.5">Vehicles due for service in the next 7 days</p>
      </div>
      {logs.length === 0 ? (
        <Empty icon={Wrench} title="No maintenance due" desc="All vehicles are up to date" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border">
                {['Vehicle','Last Service Date','Odometer','Next Due Date','Next Due KM',''].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map(m => (
                <tr key={m.id} className="border-b border-surface-border/40 hover:bg-surface-hover transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-mono text-xs font-semibold text-slate-200">{m.reg_number}</p>
                    <p className="text-xs text-slate-500">{m.make} {m.model}</p>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-400">{new Date(m.service_date).toLocaleDateString('en-IN')}</td>
                  <td className="px-5 py-3.5 text-xs font-mono text-slate-300">{m.odometer_reading?.toLocaleString()} km</td>
                  <td className="px-5 py-3.5 text-xs text-amber-400 font-medium">{m.next_service_date ? new Date(m.next_service_date).toLocaleDateString('en-IN') : '—'}</td>
                  <td className="px-5 py-3.5 text-xs font-mono text-amber-400">{m.next_service_km?.toLocaleString()} km</td>
                  <td className="px-5 py-3.5">
                    <Link to={`/vehicles/${m.vehicle_id}`} className="text-xs text-brand-400 hover:text-brand-300">View →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}