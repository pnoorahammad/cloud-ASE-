import axios from 'axios'

export const getApiBase = (): string => {
  const envVal = (import.meta as any).env.VITE_API_BASE
  if (envVal) return envVal
  
  if (typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || 
       window.location.hostname === '127.0.0.1' || 
       window.location.hostname.includes('192.168.') || 
       window.location.hostname.includes('10.'))) {
    return 'http://localhost:5000'
  }
  
  return 'https://cloud-ase.onrender.com'
}

const API_BASE = getApiBase()

const api = axios.create({ baseURL: API_BASE, headers: { 'Content-Type': 'application/json' }, withCredentials: true })

// CSRF: fetch token on first request and attach as header for mutating requests
let csrfPromise: Promise<string | null> | null = null
const fetchCsrf = async () => {
	if (!csrfPromise) {
		csrfPromise = api.get('/csrf-token').then(r => r.data.csrfToken).catch(() => null)
	}
	return csrfPromise
}

api.interceptors.request.use(async config => {
	const method = (config.method || '').toLowerCase()
	if (['post', 'put', 'delete', 'patch'].includes(method)) {
		const token = await fetchCsrf()
		if (token && config.headers) {
			config.headers['X-CSRF-Token'] = token
		}
	}
	return config
})

api.interceptors.response.use(
	(r) => r,
	(err) => {
		if (err.response?.status === 401 && !err.config?.url?.includes('/user')) {
			// Session expired on protected route
			csrfPromise = null
		}
		return Promise.reject(err)
	}
)

export default api
