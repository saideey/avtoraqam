import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — token qo'shish
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor — token yangilash
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refreshToken = localStorage.getItem('refresh_token')
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, null, {
          headers: { Authorization: `Bearer ${refreshToken}` },
        })
        localStorage.setItem('access_token', data.access_token)
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`
        return api(originalRequest)
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  sendOtp: (phone) => api.post('/auth/send-otp', { phone_number: phone }),
  verifyOtp: (phone, otp) => api.post('/auth/verify-otp', { phone_number: phone, otp }),
  sendRegisterOtp: (phone) => api.post('/auth/send-register-otp', { phone_number: phone }),
  verifyRegisterOtp: (phone, otp) => api.post('/auth/verify-register-otp', { phone_number: phone, otp }),
  changePassword: (data) => api.post('/auth/change-password', data),
  forgotPassword: (phone) => api.post('/auth/forgot-password', { phone_number: phone }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  refresh: () => api.post('/auth/refresh'),
}

// Listings
export const listingsAPI = {
  getAll: (params) => api.get('/listings', { params }),
  getOne: (id) => api.get(`/listings/${id}`),
  create: (data) => api.post('/listings', data),
  update: (id, data) => api.put(`/listings/${id}`, data),
  delete: (id) => api.delete(`/listings/${id}`),
  getMy: (params) => api.get('/listings/my', { params }),
  getOffers: (id) => api.get(`/listings/${id}/offers`),
  search: (params) => api.get('/listings/search', { params }),
}

// Offers
export const offersAPI = {
  create: (data) => api.post('/offers', data),
  getReceived: () => api.get('/offers/received'),
  getSent: () => api.get('/offers/sent'),
  accept: (id) => api.put(`/offers/${id}/accept`),
  reject: (id) => api.put(`/offers/${id}/reject`),
  cancel: (id) => api.put(`/offers/${id}/cancel`),
}

// Likes
export const likesAPI = {
  toggle: (listingId) => api.post(`/likes/${listingId}`),
  getMy: () => api.get('/likes/my'),
}

// Profile
export const profileAPI = {
  get: () => api.get('/profile'),
  update: (data) => api.put('/profile', data),
  uploadPhoto: (formData) => api.post('/profile/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
}

// Notifications
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markAllRead: () => api.put('/notifications/read-all'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
}

// Admin
export const adminAPI = {
  getUsers: (params) => api.get('/admin/users', { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  banUser: (id) => api.put(`/admin/users/${id}/ban`),
  unbanUser: (id) => api.put(`/admin/users/${id}/unban`),
  changeRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  getListings: (params) => api.get('/admin/listings', { params }),
  deleteListing: (id) => api.delete(`/admin/listings/${id}`),
  getOffers: (params) => api.get('/admin/offers', { params }),
  exportUsers: () => api.get('/admin/export/users', { responseType: 'blob' }),
  exportListings: () => api.get('/admin/export/listings', { responseType: 'blob' }),
  getLogs: (params) => api.get('/admin/logs', { params }),
  statsOverview: (params) => api.get('/admin/stats/overview', { params }),
  statsDaily: (params) => api.get('/admin/stats/daily', { params }),
  statsMonthly: () => api.get('/admin/stats/monthly'),
  statsHourly: () => api.get('/admin/stats/hourly'),
  getRegions: () => api.get('/admin/regions'),
  getPayments: (params) => api.get('/admin/payments', { params }),
  getPaymentStats: (params) => api.get('/admin/payments/stats', { params }),
}

export default api
