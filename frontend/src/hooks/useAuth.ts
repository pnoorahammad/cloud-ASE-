import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'

export const useAuth = () => {
  const [user, setUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const resp = await api.get('/user')
      setUser(resp.data)
      return resp.data
    } catch {
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const logout = async () => {
    try { await api.get('/auth/logout') } catch { /* ignore */ } finally { setUser(null) }
  }

  return { user, loading, refresh, logout }
}
