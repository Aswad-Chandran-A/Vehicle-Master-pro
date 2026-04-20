// pages/Login.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Eye, EyeOff, Loader2 } from 'lucide-react'
import { login } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [form,    setForm]    = useState({ email: 'manager@vahancheck.com', password: 'password' })
  const [showPw,  setShowPw]  = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const { authLogin } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const { data } = await login(form)
      authLogin(data.token, data.user)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const DEMO = [
    { label: 'Admin',         email: 'admin@vahancheck.com',   role: 'Full access' },
    { label: 'Fleet Manager', email: 'manager@vahancheck.com', role: 'Manage fleet' },
    { label: 'Operations',    email: 'ops@vahancheck.com',     role: 'View only' },
  ]

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-900/50">
            <ShieldCheck size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Vahan-Check</h1>
          <p className="text-slate-400 text-sm mt-1">Fleet Compliance Portal</p>
        </div>

        {/* Card */}
        <div className="card p-7">
          <h2 className="text-base font-semibold text-slate-100 mb-5">Sign in to your account</h2>

          {error && (
            <div className="bg-red-900/30 border border-red-600/30 text-red-300 rounded-lg px-4 py-3 text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Email address</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pr-10"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                />
                <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 mt-1">
              {loading ? <Loader2 size={15} className="animate-spin" /> : null}
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 pt-5 border-t border-surface-border">
            <p className="text-xs text-slate-500 mb-3">Demo accounts (password: <span className="font-mono text-slate-400">password</span>)</p>
            <div className="space-y-2">
              {DEMO.map(d => (
                <button
                  key={d.email}
                  onClick={() => setForm({ email: d.email, password: 'password' })}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-surface-hover hover:bg-surface-border border border-surface-border text-left transition-colors"
                >
                  <span className="text-xs font-medium text-slate-300">{d.label}</span>
                  <span className="text-[10px] text-slate-500">{d.role}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}