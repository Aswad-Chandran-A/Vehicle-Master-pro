// pages/VehicleDetail.jsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Upload, Eye, Trash2, Plus, Send, AlertOctagon } from 'lucide-react'
import { getVehicle, vahanFetch, updateVehicle, uploadDocument, deleteDocument, addMaintenance, sendAlert } from '../services/api'
import { StatusBadge, PageLoader, Modal, Field, useToast, ToastContainer, Alert } from '../components/UI'
import { formatDate, daysLabel, daysColor, DOC_LABELS } from '../utils/compliance'
import { useAuth } from '../context/AuthContext'

const DOC_TYPES = ['RC','Insurance','PUC','Fitness','Permit','Tax','Other']

function DocCard({ doc, onDelete, onView }) {
  const ext = doc.file_name.split('.').pop().toLowerCase()
  const icon = ext === 'pdf' ? '📄' : '🖼️'
  return (
    <div className="flex items-center gap-3 p-3 bg-surface-hover rounded-lg border border-surface-border">
      <div className="text-xl">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-200 truncate">{doc.doc_type}</p>
        <p className="text-[10px] text-slate-500 truncate">{doc.file_name}</p>
        <p className="text-[10px] text-slate-600">{new Date(doc.created_at).toLocaleDateString('en-IN')}</p>
      </div>
      <div className="flex gap-1">
        <button onClick={() => onView(doc)} className="p-1.5 text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 rounded transition-colors"><Eye size={12} /></button>
        <button onClick={() => onDelete(doc.id)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"><Trash2 size={12} /></button>
      </div>
    </div>
  )
}

function UploadModal({ open, onClose, vehicleId, onUploaded }) {
  const [file,    setFile]    = useState(null)
  const [docType, setDocType] = useState('Insurance')
  const [loading, setLoading] = useState(false)
  const [err,     setErr]     = useState('')

  async function handleUpload(e) {
    e.preventDefault()
    if (!file) return
    setLoading(true); setErr('')
    try {
      const fd = new FormData()
      fd.append('document', file)
      fd.append('vehicle_id', vehicleId)
      fd.append('doc_type', docType)
      await uploadDocument(fd)
      onUploaded(); onClose()
    } catch (e) {
      setErr(e.response?.data?.message || 'Upload failed')
    } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Upload Document">
      {err && <p className="text-red-400 text-sm mb-3">{err}</p>}
      <form onSubmit={handleUpload} className="space-y-4">
        <Field label="Document Type">
          <select className="input" value={docType} onChange={e => setDocType(e.target.value)}>
            {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="File (PDF, PNG, JPG — max 5MB)">
          <div className="border-2 border-dashed border-surface-border rounded-lg p-6 text-center hover:border-brand-600/50 transition-colors cursor-pointer" onClick={() => document.getElementById('file-input').click()}>
            <Upload size={20} className="mx-auto text-slate-500 mb-2" />
            {file ? <p className="text-sm text-slate-300">{file.name}</p> : <p className="text-sm text-slate-500">Click to choose file</p>}
          </div>
          <input id="file-input" type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={e => setFile(e.target.files[0])} />
        </Field>
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading || !file} className="btn-primary">{loading ? 'Uploading...' : 'Upload'}</button>
        </div>
      </form>
    </Modal>
  )
}

function MaintenanceModal({ open, onClose, vehicleId, onSaved }) {
  const [form,    setForm]    = useState({ service_date: new Date().toISOString().split('T')[0], odometer_reading: '', service_type: '', parts_replaced: '', total_cost: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const [err,     setErr]     = useState('')
  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSave(e) {
    e.preventDefault(); setLoading(true); setErr('')
    try { await addMaintenance({ ...form, vehicle_id: vehicleId }); onSaved(); onClose() }
    catch (e) { setErr(e.response?.data?.message || 'Failed to save') }
    finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Log Maintenance Entry">
      {err && <p className="text-red-400 text-sm mb-3">{err}</p>}
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Service Date" required><input type="date" className="input" value={form.service_date} onChange={e => set('service_date', e.target.value)} required /></Field>
          <Field label="Odometer (km)" required><input type="number" className="input" placeholder="45000" value={form.odometer_reading} onChange={e => set('odometer_reading', e.target.value)} required /></Field>
          <Field label="Service Type" required><input className="input" placeholder="Oil change, Tyre rotation..." value={form.service_type} onChange={e => set('service_type', e.target.value)} required /></Field>
          <Field label="Total Cost (₹)"><input type="number" className="input" placeholder="3500" value={form.total_cost} onChange={e => set('total_cost', e.target.value)} /></Field>
        </div>
        <Field label="Parts Replaced"><input className="input" placeholder="Oil filter, Air filter..." value={form.parts_replaced} onChange={e => set('parts_replaced', e.target.value)} /></Field>
        <Field label="Notes"><textarea className="input resize-none" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} /></Field>
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Saving...' : 'Save Log'}</button>
        </div>
      </form>
    </Modal>
  )
}

export default function VehicleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [vehicle,   setVehicle]   = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [syncing,   setSyncing]   = useState(false)
  const [uploadOpen,setUploadOpen]= useState(false)
  const [maintOpen, setMaintOpen] = useState(false)
  const [preview,   setPreview]   = useState(null)
  const { isManager }             = useAuth()
  const { toast, toasts }         = useToast()

  async function load() {
    try { const { data } = await getVehicle(id); setVehicle(data.data) }
    catch { navigate('/vehicles') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])

  async function handleSync() {
    setSyncing(true)
    try {
      const { data } = await vahanFetch(vehicle.reg_number)
      await updateVehicle(id, { ins_expiry: data.data.ins_expiry, puc_expiry: data.data.puc_expiry, fit_expiry: data.data.fit_expiry, last_sync: new Date() })
      toast('Synced from Vahan API ✓'); load()
    } catch (e) { toast(e.response?.data?.message || 'Sync failed', 'error') }
    finally { setSyncing(false) }
  }

  async function handleDelDoc(docId) {
    try { await deleteDocument(docId); toast('Document deleted'); load() }
    catch { toast('Delete failed', 'error') }
  }

  async function handleSendAlert() {
    try { await sendAlert(id); toast('Alert dispatched ✓') }
    catch { toast('Alert failed', 'error') }
  }

  if (loading) return <PageLoader />
  if (!vehicle) return null

  const comp = vehicle.compliance || {}
  const dm   = comp.daysMap || {}
  const docs  = vehicle.documents || []
  const maint = vehicle.maintenance || []

  const DOC_DISPLAY = [
    { key: 'INS', label: 'Insurance',  date: vehicle.ins_expiry },
    { key: 'PUC', label: 'PUC',        date: vehicle.puc_expiry },
    { key: 'FIT', label: 'Fitness',    date: vehicle.fit_expiry },
    { key: 'RC',  label: 'RC',         date: vehicle.rc_expiry },
    { key: 'PERMIT', label: 'Permit',  date: vehicle.permit_expiry },
    { key: 'TAX', label: 'Tax',        date: vehicle.tax_expiry },
  ]

  return (
    <div className="p-6 animate-fade-in max-w-5xl">
      <ToastContainer toasts={toasts} />

      {/* Upload & Maintenance modals */}
      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} vehicleId={id} onUploaded={load} />
      <MaintenanceModal open={maintOpen} onClose={() => setMaintOpen(false)} vehicleId={id} onSaved={load} />

      {/* Doc preview modal */}
      <Modal open={!!preview} onClose={() => setPreview(null)} title="Document Preview" wide>
        {preview && (
          preview.mime_type === 'application/pdf'
            ? <iframe src={`/api/documents/view/${preview.file_path}`} className="w-full h-96 rounded-lg border border-surface-border" />
            : <img src={`/api/documents/view/${preview.file_path}`} className="w-full rounded-lg" alt="document" />
        )}
      </Modal>

      {/* Back + actions */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/vehicles')} className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm transition-colors">
          <ArrowLeft size={16} /> Back to Fleet
        </button>
        <div className="flex gap-2">
          {isManager && <>
            <button onClick={handleSync} disabled={syncing} className="btn-secondary flex items-center gap-2">
              <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} /> {syncing ? 'Syncing...' : 'Sync Vahan'}
            </button>
            <button onClick={handleSendAlert} className="btn-secondary flex items-center gap-2">
              <Send size={13} /> Send Alert
            </button>
          </>}
        </div>
      </div>

      {/* Blacklisted banner */}
      {vehicle.is_blacklisted && <div className="mb-4"><Alert type="error" message="⚠️ This vehicle is BLACKLISTED in the RTO database. Immediate action required." /></div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: vehicle info */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="font-mono text-xl font-bold text-white">{vehicle.reg_number}</div>
                <div className="text-slate-400 text-sm mt-0.5">{vehicle.make} {vehicle.model} · {vehicle.fuel_type} · {vehicle.vehicle_type}</div>
              </div>
              <StatusBadge status={comp.overall} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Owner',   vehicle.owner_name    || '—'],
                ['Contact', vehicle.owner_contact || '—'],
                ['Chassis', vehicle.chassis_number || '—'],
                ['Engine',  vehicle.engine_number  || '—'],
                ['Last Sync', vehicle.last_sync ? new Date(vehicle.last_sync).toLocaleString('en-IN') : 'Never'],
                ['Manager', vehicle.manager_name   || '—'],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">{k}</p>
                  <p className="text-slate-300 text-xs mt-0.5 font-medium">{v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance grid */}
          <div className="card p-5">
            <p className="text-sm font-semibold text-slate-200 mb-4">Document Expiry Status</p>
            <div className="grid grid-cols-3 gap-3">
              {DOC_DISPLAY.map(({ key, label, date }) => (
                <div key={key} className={`p-3 rounded-lg border ${(dm[key] ?? 999) <= 0 ? 'bg-red-500/10 border-red-500/20' : (dm[key] ?? 999) <= 15 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-surface-hover border-surface-border'}`}>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</p>
                  <p className="text-xs font-medium text-slate-300 mt-0.5">{formatDate(date)}</p>
                  <p className={`text-xs font-semibold mt-1 ${daysColor(dm[key])}`}>{daysLabel(dm[key])}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Maintenance logs */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-slate-200">Maintenance History</p>
              {isManager && <button onClick={() => setMaintOpen(true)} className="btn-secondary flex items-center gap-1.5 text-xs py-1.5"><Plus size={12} /> Log Entry</button>}
            </div>
            {maint.length === 0 ? <p className="text-slate-500 text-sm">No maintenance records yet.</p> : (
              <div className="space-y-3">
                {maint.map(m => (
                  <div key={m.id} className="flex gap-4 p-3 bg-surface-hover rounded-lg border border-surface-border text-xs">
                    <div className="text-slate-400 whitespace-nowrap">{formatDate(m.service_date)}</div>
                    <div className="flex-1">
                      <p className="text-slate-200 font-medium">{m.service_type}</p>
                      {m.parts_replaced && <p className="text-slate-500 mt-0.5">{m.parts_replaced}</p>}
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <p className="text-slate-300 font-mono">{m.odometer_reading?.toLocaleString()} km</p>
                      {m.total_cost > 0 && <p className="text-emerald-400">₹{parseFloat(m.total_cost).toLocaleString()}</p>}
                    </div>
                    {m.next_service_km && <div className="text-right whitespace-nowrap text-amber-400">Next: {m.next_service_km?.toLocaleString()} km</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: document vault */}
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-slate-200">Document Vault</p>
              {isManager && <button onClick={() => setUploadOpen(true)} className="btn-secondary flex items-center gap-1.5 text-xs py-1.5"><Upload size={12} /> Upload</button>}
            </div>
            {docs.length === 0 ? <p className="text-slate-500 text-xs">No documents uploaded yet.</p> : (
              <div className="space-y-2">
                {docs.filter(d => d.is_active).map(d => (
                  <DocCard key={d.id} doc={d} onDelete={handleDelDoc} onView={setPreview} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}