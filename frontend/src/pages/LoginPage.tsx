import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Container, Box, Button, Typography, CircularProgress, TextField, Paper, Tabs, Tab, Alert, Divider
} from '@mui/material'
import { useAuth } from '../hooks/useAuth'
import { signUp, signIn } from '../services/auth'

const LoginPage: React.FC = () => {
  const [tab, setTab] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, loading: authLoading, refresh } = useAuth()

  useEffect(() => {
    const oauthError = searchParams.get('error')
    if (oauthError) setError(decodeURIComponent(oauthError))
  }, [searchParams])

  useEffect(() => {
    if (!authLoading && user) navigate('/dashboard', { replace: true })
  }, [user, authLoading, navigate])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      await signUp({ email, password, fullName })
      await refresh()
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      await signIn({ email, password })
      await refresh()
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSalesforce = () => {
    const base = (import.meta as any).env.VITE_API_BASE || 'http://localhost:5000'
    window.location.href = `${base}/auth/login?redirect=true`
  }

  const handleSimulate = () => {
    const base = (import.meta as any).env.VITE_API_BASE || 'http://localhost:5000'
    window.location.href = `${base}/auth/login?redirect=true`
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" align="center" gutterBottom>Validation Rule Manager</Typography>
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 2 }}>
            Sign in or create an account — then connect Salesforce from the sidebar
          </Typography>

          <Tabs value={tab} onChange={(_, v) => { setTab(v); setError(null) }} centered sx={{ mb: 2 }}>
            <Tab label="Sign In" />
            <Tab label="Sign Up" />
          </Tabs>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {tab === 0 ? (
            <Box component="form" onSubmit={handleSignIn}>
              <TextField
                fullWidth
                label="Email (Gmail)"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
              />
              <Button fullWidth type="submit" variant="contained" size="large" disabled={loading} sx={{ mt: 2 }}>
                {loading ? <CircularProgress size={22} /> : 'Sign In'}
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSignUp}>
              <TextField
                fullWidth
                label="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Email (Gmail)"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                helperText="Minimum 6 characters"
              />
              <Button fullWidth type="submit" variant="contained" size="large" disabled={loading} sx={{ mt: 2 }}>
                {loading ? <CircularProgress size={22} /> : 'Sign Up'}
              </Button>
            </Box>
          )}

          <Divider sx={{ my: 3 }}>or</Divider>

          <Button fullWidth variant="outlined" onClick={handleSalesforce} disabled={loading} sx={{ mb: 1 }}>
            Login with Salesforce
          </Button>
          <Button fullWidth variant="text" size="small" onClick={handleSimulate} disabled={loading}>
            Simulate Salesforce (dev)
          </Button>
        </Paper>
      </Box>
    </Container>
  )
}

export default LoginPage
