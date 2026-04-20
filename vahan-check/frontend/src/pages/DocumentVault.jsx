// pages/DocumentVault.jsx
import { useEffect, useState } from 'react'
import { getVehicles } from '../services/api'
import { getDocuments } from '../services/api'
import { PageLoader, Empty } from '../components/UI'
import { FileText } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function DocumentVault() {
  const [vehicles, setVehicles] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    getVehicles({ limit: 200 })
      .then(r => setVehicles(r.data.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Document Vault</h1>
        <p className="text-slate-400 text-sm mt-0.5">View and manage documents for all vehicles</p>
      </div>
      {vehicles.length === 0 ? <Empty icon={FileText} title="No vehicles" desc="Add vehicles to manage documents" /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map(v => (
            <Link key={v.id} to={`/vehicles/${v.id}`} className="card p-4 hover:border-brand-600/40 transition-colors group">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-sm font-bold text-white">{v.reg_number}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${v.compliance?.overall === 'green' ? 'bg-emerald-500/15 text-emerald-400' : v.compliance?.overall === 'yellow' ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400'}`}>
                  {v.compliance?.overall}
                </span>
              </div>
              <p className="text-slate-400 text-xs">{v.make} {v.model}</p>
              <p className="text-brand-400 text-xs mt-3 group-hover:underline">View documents →</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}