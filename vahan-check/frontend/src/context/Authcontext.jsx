// context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'
import { getMe } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => JSON.parse(localStorage.getItem('vc_user') || 'null'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('vc_token')
    if (token) {
      getMe()
        .then(r => { setUser(r.data.user); localStorage.setItem('vc_user', JSON.stringify(r.data.user)) })
        .catch(() => logout())
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  function authLogin(token, userData) {
    localStorage.setItem('vc_token', token)
    localStorage.setItem('vc_user',  JSON.stringify(userData))
    setUser(userData)
  }

  function logout() {
    localStorage.removeItem('vc_token')
    localStorage.removeItem('vc_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, authLogin, logout, isAdmin: user?.role === 'admin', isManager: ['admin','fleet_manager'].includes(user?.role) }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)