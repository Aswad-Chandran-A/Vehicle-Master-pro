// services/api.js
import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// Attach JWT to every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('vc_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// Global 401 handler
api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('vc_token')
      localStorage.removeItem('vc_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// Auth
export const login         = (data)   => api.post('/auth/login', data)
export const getMe         = ()        => api.get('/auth/me')
export const changePassword= (data)   => api.post('/auth/change-password', data)

// Vehicles
export const getVehicles   = (params) => api.get('/vehicles', { params })
export const getVehicle    = (id)     => api.get(`/vehicles/${id}`)
export const createVehicle = (data)   => api.post('/vehicles', data)
export const updateVehicle = (id, d)  => api.put(`/vehicles/${id}`, d)
export const deleteVehicle = (id)     => api.delete(`/vehicles/${id}`)
export const vahanFetch    = (reg)    => api.post('/vehicles/vahan-fetch', { reg_number: reg })
export const sendAlert     = (id)     => api.post(`/vehicles/${id}/send-alert`)
export const bulkImport    = (data)   => api.post('/vehicles/bulk-import', { vehicles: data })

// Documents
export const getDocuments  = (vid)    => api.get(`/documents/vehicle/${vid}`)
export const deleteDocument= (id)     => api.delete(`/documents/${id}`)
export const uploadDocument= (fd)     => api.post('/documents/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })

// Maintenance
export const getMaintenance= (vid)    => api.get(`/maintenance/vehicle/${vid}`)
export const addMaintenance= (data)   => api.post('/maintenance', data)
export const getDueMaint   = ()       => api.get('/maintenance/due')

// Reports
export const getDashboard  = ()       => api.get('/reports/dashboard')
export const exportCsv     = (params) => api.get('/reports/export-csv', { params, responseType: 'blob' })
export const getNotifLogs  = ()       => api.get('/reports/notifications')