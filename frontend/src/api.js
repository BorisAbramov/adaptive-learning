import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refreshToken = localStorage.getItem('refreshToken')
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken })
        localStorage.setItem('accessToken', data.data.accessToken)
        localStorage.setItem('refreshToken', data.data.refreshToken)
        original.headers.Authorization = `Bearer ${data.data.accessToken}`
        return api(original)
      } catch {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api

// ─── Services ─────────────────────────────────────────────────────────────────
export const authAPI = {
  register: d  => api.post('/auth/register', d),
  login:    d  => api.post('/auth/login', d),
  logout:   () => api.post('/auth/logout'),
  getMe:    () => api.get('/auth/me')
}

export const coursesAPI = {
  getAll:  p    => api.get('/courses', { params: p }),
  getMy:   ()   => api.get('/courses/my'),
  getById: id   => api.get(`/courses/${id}`),
  enroll:  id   => api.post(`/courses/${id}/enroll`),
  create:  d    => api.post('/courses', d),
}

export const modulesAPI = {
  getById:  id  => api.get(`/modules/${id}`),
  complete: (courseId, moduleId, d) => api.post(`/progress/${courseId}/modules/${moduleId}/complete`, d)
}

export const progressAPI  = { get: id => api.get(`/progress/${id}`) }
export const eventsAPI    = { track: d => api.post('/progress/events', d) }
export const recommendationsAPI = { get: p => api.get('/recommendations', { params: p }) }
