// components/Sidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Truck, FileText, Wrench, BarChart2, Bell, LogOut, ShieldCheck, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/',            icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/vehicles',    icon: Truck,           label: 'Fleet' },
  { to: '/documents',   icon: FileText,        label: 'Document Vault' },
  { to: '/maintenance', icon: Wrench,          label: 'Maintenance' },
  { to: '/reports',     icon: BarChart2,       label: 'Reports' },
  { to: '/alerts',      icon: Bell,            label: 'Alert Logs' },
]

const ROLE_COLORS = { admin: 'text-brand-400', fleet_manager: 'text-emerald-400', operations: 'text-amber-400' }
const ROLE_LABELS = { admin: 'System Admin', fleet_manager: 'Fleet Manager', operations: 'Operations' }

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() { logout(); navigate('/login') }

  return (
    <aside className="w-60 flex-shrink-0 bg-surface-card border-r border-surface-border flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-surface-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={16} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-wide">Vahan-Check</div>
            <div className="text-[10px] text-slate-500 -mt-0.5">Fleet Compliance Portal</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group ${
                isActive
                  ? 'bg-brand-600/20 text-brand-400 font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-surface-hover'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={16} className={isActive ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight size={12} />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-3 border-t border-surface-border">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface-hover mb-1">
          <div className="w-7 h-7 rounded-full bg-brand-700 flex items-center justify-center text-xs font-semibold text-brand-200 flex-shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-slate-200 truncate">{user?.name}</div>
            <div className={`text-[10px] ${ROLE_COLORS[user?.role]}`}>{ROLE_LABELS[user?.role]}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all w-full"
        >
          <LogOut size={15} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  )
}