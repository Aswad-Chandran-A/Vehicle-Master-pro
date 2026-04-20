// App.jsx - Main router
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuth, AuthProvider } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Vehicles from './pages/Vehicles'
import VehicleDetail from './pages/VehicleDetail'
import DocumentVault from './pages/DocumentVault'
import Maintenance from './pages/Maintenance'
import Reports from './pages/Reports'
import Alerts from './pages/Alerts'
import { Spinner } from './components/UI'

function ProtectedLayout() {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <Spinner size={32} />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/"             element={<Dashboard />} />
        <Route path="/vehicles"     element={<Vehicles />} />
        <Route path="/vehicles/:id" element={<VehicleDetail />} />
        <Route path="/documents"    element={<DocumentVault />} />
        <Route path="/maintenance"  element={<Maintenance />} />
        <Route path="/reports"      element={<Reports />} />
        <Route path="/alerts"       element={<Alerts />} />
        <Route path="*"             element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}