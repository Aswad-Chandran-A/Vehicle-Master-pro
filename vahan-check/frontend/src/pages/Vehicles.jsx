// pages/Vehicles.jsx
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Filter, Truck, Send, Trash2, Upload } from 'lucide-react'
import { getVehicles, deleteVehicle, sendAlert, createVehicle, vahanFetch } from '../services/api'
import { StatusBadge, PageLoader, Modal, Field, Confirm, useToast, ToastContainer, Empty } from '../components/UI'
import { formatDate, daysLabel, daysColor } from '../utils/compliance'
import { useAuth } from '../context/AuthContext'

const FUEL   = ['Diesel','Petrol','CNG','Electric','Hybrid']
const VTYPE  = ['HCV','LCV','Trailer','Bus','Other']
const STATUS = ['','green','yellow','red']
const STATUS_LABELS = { '': 'All', green: 'Compliant', yellow: 'Expiring', red: 'Expired' }

function AddVehicleModal({ open, onClose, onSaved }) {
  const [form,    setForm]    = useState({ reg_number:'', make:'', model:'', fuel_type:'Diesel', vehicle_type:'HCV', ins_expiry:'', puc_expiry:'', fit_expiry:'', owner_name:'', owner_contact:'' })
  const [fetching,setFetching]= useState(false)
  const [saving,  setSaving]  = useState(false)
  const [err,     setErr]     = useState('')
  const { toast, toasts }     = useToast()

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function fetchVahan() {
    if (!form.reg_number) return
    setFetching(true); setErr('')
    try {
      const { data } = await vahanFetch(form.reg_number)
      const d = data.data
      setForm(f => ({ ...f, make: d.make||f.make, model: d.model||f.model, fuel_type: d.fuel_type||f.fuel_type, vehicle_type: d.vehicle_type||f.vehicle_type, owner_name: d.owner_name||f.owner_name, owner_contact: d.owner_contact||f.owner_contact, ins_expiry: d.ins_expiry||f.ins_expiry, puc_expiry: d.puc_expiry||f.puc_expiry, fit_expiry: d.fit_expiry||f.fit_expiry }))
      toast('Data fetched from Vahan API ✓')
    } catch (e) {
      setErr(e.response?.data?.message || 'API fetch failed — enter details manually')
    } finally { setFetching(false) }
  }

  async function handleSave(e) {
    e.preventDefault(); setSaving(true); setErr('')
    try {
      await createVehicle(form)
      onSaved(); onClose()
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to save vehicle')
    } finally { setSaving(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add New Vehicle" wide>
      <ToastContainer toasts={toasts} />
      {err && <div className="bg-red-900/30 border border-red-600/30 text-red-300 rounded-lg px-3 py-2 text-sm mb-4">{err}</div>}
      <form onSubmit={handleSave} className="space-y-4">
        {/* Reg + Vahan fetch */}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Field label="Registration Number" required>
              <input className="input font-mono uppercase" placeholder="MH01AB1234" value={form.reg_number} onChange={e => set('reg_number', e.target.value.toUpperCase())} required />
            </Field>
          </div>
          <button type="button" onClick={fetchVahan} disabled={fetching} className="btn-secondary flex items-center gap-2 whitespace-nowrap">
            {fetching ? '⌛ Fetching...' : '🔄 Fetch from Vahan'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Make" required><input className="input" value={form.make} onChange={e => set('make', e.target.value)} required /></Field>
          <Field label="Model" required><input className="input" value={form.model} onChange={e => set('model', e.target.value)} required /></Field>
          <Field label="Fuel Type">
            <select className="input" value={form.fuel_type} onChange={e => set('fuel_type', e.target.value)}>
              {FUEL.map(f => <option key={f}>{f}</option>)}
            </select>
          </Field>
          <Field label="Vehicle Type">
            <select className="input" value={form.vehicle_type} onChange={e => set('vehicle_type', e.target.value)}>
              {VTYPE.map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Owner Name"><input className="input" value={form.owner_name} onChange={e => set('owner_name', e.target.value)} /></Field>
          <Field label="Owner Contact"><input className="input" value={form.owner_contact} onChange={e => set('owner_contact', e.target.value)} /></Field>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Insurance Expiry" required><input type="date" className="input" value={form.ins_expiry} onChange={e => set('ins_expiry', e.target.value)} required /></Field>
          <Field label="PUC Expiry" required><input type="date" className="input" value={form.puc_expiry} onChange={e => set('puc_expiry', e.target.value)} required /></Field>
          <Field label="Fitness Expiry" required><input type="date" className="input" value={form.fit_expiry} onChange={e => set('fit_expiry', e.target.value)} required /></Field>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Vehicle'}</button>
        </div>
      </form>
    </Modal>
  )
}

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [status,   setStatus]   = useState('')
  const [addOpen,  setAddOpen]  = useState(false)
  const [delId,    setDelId]    = useState(null)
  const { isManager, isAdmin }  = useAuth()
  const { toast, toasts }       = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getVehicles({ search, status, limit: 100 })
      setVehicles(data.data)
    } finally { setLoading(false) }
  }, [search, status])

  useEffect(() => { load() }, [load])

  async function handleDelete() {
    try { await deleteVehicle(delId); toast('Vehicle deleted'); setDelId(null); load() }
    catch { toast('Delete failed', 'error') }
  }

  async function handleAlert(id) {
    try { await sendAlert(id); toast('Alert sent successfully ✓') }
    catch { toast('Failed to send alert', 'error') }
  }

  return (
    <div className="p-6 animate-fade-in">
      <ToastContainer toasts={toasts} />
      <AddVehicleModal open={addOpen} onClose={() => setAddOpen(false)} onSaved={load} />
      <Confirm open={!!delId} onClose={() => setDelId(null)} onConfirm={handleDelete} danger title="Delete Vehicle" message="This will permanently delete the vehicle and all its documents. This cannot be undone." />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Fleet Management</h1>
          <p className="text-slate-400 text-sm mt-0.5">{vehicles.length} vehicles</p>
        </div>
        {isManager && (
          <button onClick={() => setAddOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> Add Vehicle
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="input pl-8" placeholder="Search by reg, make, model..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5">
          {STATUS.map(s => (
            <button key={s} onClick={() => setStatus(s)} className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${status === s ? 'bg-brand-600/20 text-brand-400 border-brand-600/40' : 'text-slate-400 border-surface-border hover:bg-surface-hover'}`}>
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? <PageLoader /> : vehicles.length === 0 ? (
        <Empty icon={Truck} title="No vehicles found" desc="Add your first vehicle to get started" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border">
                  {['Reg Number','Make / Model','Fuel','Insurance','PUC','Fitness','Overall','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vehicles.map(v => {
                  const dm = v.compliance?.daysMap || {}
                  return (
                    <tr key={v.id} className="border-b border-surface-border/40 hover:bg-surface-hover transition-colors">
                      <td className="px-4 py-3.5 font-mono text-xs font-semibold text-slate-200">{v.reg_number}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="text-slate-200 text-xs font-medium">{v.make}</div>
                        <div className="text-slate-500 text-xs">{v.model}</div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-400">{v.fuel_type}</td>
                      <td className={`px-4 py-3.5 text-xs font-medium ${daysColor(dm.INS)}`}>{daysLabel(dm.INS)}</td>
                      <td className={`px-4 py-3.5 text-xs font-medium ${daysColor(dm.PUC)}`}>{daysLabel(dm.PUC)}</td>
                      <td className={`px-4 py-3.5 text-xs font-medium ${daysColor(dm.FIT)}`}>{daysLabel(dm.FIT)}</td>
                      <td className="px-4 py-3.5"><StatusBadge status={v.compliance?.overall} /></td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <Link to={`/vehicles/${v.id}`} className="p-1.5 text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors" title="View"><Truck size={13} /></Link>
                          {isManager && <button onClick={() => handleAlert(v.id)} className="p-1.5 text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors" title="Send Alert"><Send size={13} /></button>}
                          {isAdmin && <button onClick={() => setDelId(v.id)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete"><Trash2 size={13} /></button>}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}