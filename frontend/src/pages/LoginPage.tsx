import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Box, Button, Typography, CircularProgress, TextField, Paper, Alert, Divider,
  Grid, MenuItem, Select, FormControl, InputLabel, Checkbox, FormControlLabel, Link
} from '@mui/material'
import { Cloud, Security, History, Layers } from '@mui/icons-material'
import { useAuth } from '../hooks/useAuth'
import { signUp, signIn } from '../services/auth'
import { getApiBase } from '../services/api'

const LoginPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(true) // Default to SignUp to match Salesforce trial signup page!
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Sign Up Form Data
  const [signUpData, setSignUpData] = useState({
    firstName: '',
    lastName: '',
    emailAddress: '',
    jobRole: 'Developer',
    company: '',
    country: 'United States',
    postalCode: '',
    username: '',
    password: '',
    agreed: false
  })

  // Sign In Form Data
  const [signInData, setSignInData] = useState({
    username: '',
    password: ''
  })

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

  const handleSignUpChange = (e: any) => {
    const { name, value, checked, type } = e.target
    setSignUpData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSignInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSignInData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signUpData.agreed) {
      setError('You must agree to the Master Subscription Agreement.')
      return
    }
    if (signUpData.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (!signUpData.username.includes('@')) {
      setError('Username must be in an email address format (e.g. name@company.com).')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const fullName = `${signUpData.firstName.trim()} ${signUpData.lastName.trim()}`
      await signUp({
        email: signUpData.username.toLowerCase().trim(),
        password: signUpData.password,
        fullName,
        firstName: signUpData.firstName.trim(),
        lastName: signUpData.lastName.trim(),
        emailAddress: signUpData.emailAddress.toLowerCase().trim(),
        jobRole: signUpData.jobRole,
        company: signUpData.company.trim(),
        country: signUpData.country,
        postalCode: signUpData.postalCode.trim()
      })
      await refresh()
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      await signIn({
        email: signInData.username.toLowerCase().trim(),
        password: signInData.password
      })
      await refresh()
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSalesforce = () => {
    const base = getApiBase()
    window.location.href = `${base}/auth/login?redirect=true`
  }

  const handleSimulate = () => {
    const base = getApiBase()
    window.location.href = `${base}/auth/login?redirect=true`
  }

  return (
    <Grid container sx={{ minHeight: '100vh', width: '100vw', m: 0 }}>
      {/* Left Column - Salesforce Branding Info */}
      <Grid item xs={12} md={6} sx={{
        background: 'linear-gradient(135deg, #032d60 0%, #011e41 100%)',
        color: 'white',
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        p: 6,
        boxSizing: 'border-box'
      }}>
        <Box sx={{ maxWidth: '500px', width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
            <Cloud sx={{ fontSize: 48, color: '#0176D3' }} />
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-1px' }}>
              salesforce
            </Typography>
          </Box>

          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, fontSize: '2.5rem', lineHeight: 1.2 }}>
            Get your Developer Edition.
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 400, color: '#94a3b8', mb: 4, lineHeight: 1.5 }}>
            A premium full-featured validation rule manager sandbox environment, ready out of the box.
          </Typography>

          <Box
            component="img"
            src="/assets/salesforce_developer_bg.png"
            alt="Salesforce Developer mascot Einstein Astro illustration"
            sx={{
              width: '100%',
              maxWidth: '380px',
              height: 'auto',
              borderRadius: '16px',
              mb: 4,
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'scale(1.02)'
              }
            }}
          />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Layers sx={{ color: '#0176D3', fontSize: 24, mt: 0.5 }} />
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>Full Metadata Visibility</Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>Fetch, view, filter, and inspect validation rules for Account, Contact, and Opportunity objects.</Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <History sx={{ color: '#0176D3', fontSize: 24, mt: 0.5 }} />
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>Local Audit Auditing</Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>Keep full historical records of rule state modifications locally for team-wide audit compliance.</Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Security sx={{ color: '#0176D3', fontSize: 24, mt: 0.5 }} />
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>Staged Deployments & Diff Check</Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>Compare modified rules to production Salesforce metadata before executing single-click deployments.</Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Grid>

      {/* Right Column - Forms (Sign Up / Sign In) */}
      <Grid item xs={12} md={6} sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        p: { xs: 2, sm: 4, md: 6 },
        backgroundColor: '#f8fafc',
        boxSizing: 'border-box'
      }}>
        <Paper elevation={0} sx={{
          p: { xs: 3, sm: 4 },
          width: '100%',
          maxWidth: '520px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
          backgroundColor: '#ffffff'
        }}>
          {/* Form Header */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', justifyContent: 'center', mb: 2, gap: 1 }}>
            <Cloud sx={{ fontSize: 32, color: '#0176D3' }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#032d60', letterSpacing: '-0.5px' }}>
              salesforce
            </Typography>
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b', mb: 1, letterSpacing: '-0.5px' }}>
            {isSignUp ? 'Sign up for a free developer account' : 'Sign in to your account'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {isSignUp ? (
              <>
                Already registered?{' '}
                <Link component="button" variant="body2" onClick={() => { setIsSignUp(false); setError(null) }} sx={{ fontWeight: 700, color: '#0176D3', textDecoration: 'none' }}>
                  Log In
                </Link>
              </>
            ) : (
              <>
                Need a developer sandbox?{' '}
                <Link component="button" variant="body2" onClick={() => { setIsSignUp(true); setError(null) }} sx={{ fontWeight: 700, color: '#0176D3', textDecoration: 'none' }}>
                  Sign up
                </Link>
              </>
            )}
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '4px' }}>{error}</Alert>}

          {isSignUp ? (
            /* SIGN UP FORM */
            <Box component="form" onSubmit={handleSignUpSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    name="firstName"
                    value={signUpData.firstName}
                    onChange={handleSignUpChange}
                    required
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    name="lastName"
                    value={signUpData.lastName}
                    onChange={handleSignUpChange}
                    required
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    name="emailAddress"
                    type="email"
                    value={signUpData.emailAddress}
                    onChange={handleSignUpChange}
                    required
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small" required>
                    <InputLabel id="job-role-label">Job Role</InputLabel>
                    <Select
                      labelId="job-role-label"
                      label="Job Role"
                      name="jobRole"
                      value={signUpData.jobRole}
                      onChange={handleSignUpChange}
                    >
                      <MenuItem value="Developer">Developer</MenuItem>
                      <MenuItem value="Administrator">Administrator</MenuItem>
                      <MenuItem value="Architect">Architect</MenuItem>
                      <MenuItem value="IT Manager">IT Manager / Director</MenuItem>
                      <MenuItem value="Business Analyst">Business Analyst</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Company"
                    name="company"
                    value={signUpData.company}
                    onChange={handleSignUpChange}
                    required
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small" required>
                    <InputLabel id="country-label">Country/Region</InputLabel>
                    <Select
                      labelId="country-label"
                      label="Country/Region"
                      name="country"
                      value={signUpData.country}
                      onChange={handleSignUpChange}
                    >
                      <MenuItem value="United States">United States</MenuItem>
                      <MenuItem value="India">India</MenuItem>
                      <MenuItem value="United Kingdom">United Kingdom</MenuItem>
                      <MenuItem value="Canada">Canada</MenuItem>
                      <MenuItem value="Australia">Australia</MenuItem>
                      <MenuItem value="Germany">Germany</MenuItem>
                      <MenuItem value="France">France</MenuItem>
                      <MenuItem value="Japan">Japan</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Postal Code"
                    name="postalCode"
                    value={signUpData.postalCode}
                    onChange={handleSignUpChange}
                    required
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Username"
                    name="username"
                    placeholder="name@yourcompany.com"
                    value={signUpData.username}
                    onChange={handleSignUpChange}
                    required
                    size="small"
                    helperText="Must be in an email address format and unique."
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Password"
                    name="password"
                    type="password"
                    value={signUpData.password}
                    onChange={handleSignUpChange}
                    required
                    size="small"
                    helperText="Minimum 6 characters"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="agreed"
                        checked={signUpData.agreed}
                        onChange={handleSignUpChange}
                        color="primary"
                        required
                      />
                    }
                    label={
                      <Typography variant="caption" color="text.secondary">
                        I read and agree to the Master Subscription Agreement and the Developer Edition Terms of Use.
                      </Typography>
                    }
                  />
                </Grid>
              </Grid>

              <Button
                fullWidth
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                  mt: 3,
                  py: 1.2,
                  backgroundColor: '#0176D3',
                  fontWeight: 700,
                  textTransform: 'none',
                  fontSize: '15px',
                  borderRadius: '4px',
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: '#015aaf',
                    boxShadow: 'none'
                  }
                }}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign Up'}
              </Button>
            </Box>
          ) : (
            /* SIGN IN FORM */
            <Box component="form" onSubmit={handleSignInSubmit}>
              <TextField
                fullWidth
                label="Username / Email"
                name="username"
                value={signInData.username}
                onChange={handleSignInChange}
                margin="normal"
                required
                size="small"
              />
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={signInData.password}
                onChange={handleSignInChange}
                margin="normal"
                required
                size="small"
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                  mt: 3,
                  py: 1.2,
                  backgroundColor: '#0176D3',
                  fontWeight: 700,
                  textTransform: 'none',
                  fontSize: '15px',
                  borderRadius: '4px',
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: '#015aaf',
                    boxShadow: 'none'
                  }
                }}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Log In'}
              </Button>
            </Box>
          )}

          {/* Salesforce Connect Section */}
          <Box sx={{ my: 3.5, position: 'relative', textAlign: 'center' }}>
            <Divider />
            <Typography variant="body2" sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              px: 2,
              backgroundColor: '#ffffff',
              color: 'text.secondary',
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              or connect with salesforce
            </Typography>
          </Box>

          <Button
            fullWidth
            variant="outlined"
            onClick={handleSalesforce}
            disabled={loading}
            startIcon={<Cloud sx={{ color: '#0176D3' }} />}
            sx={{
              py: 1.2,
              borderColor: '#0176D3',
              color: '#0176D3',
              fontWeight: 700,
              textTransform: 'none',
              fontSize: '15px',
              borderRadius: '4px',
              '&:hover': {
                borderColor: '#015aaf',
                backgroundColor: 'rgba(1, 118, 211, 0.04)'
              },
              mb: 1.5
            }}
          >
            Log In with Salesforce (OAuth)
          </Button>

          <Button
            fullWidth
            variant="text"
            onClick={handleSimulate}
            disabled={loading}
            sx={{
              textTransform: 'none',
              color: '#64748b',
              fontWeight: 600,
              fontSize: '13px',
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.02)',
                color: '#475569'
              }
            }}
          >
            Simulate Salesforce Session (Dev Sandbox)
          </Button>
        </Paper>
      </Grid>
    </Grid>
  )
}

export default LoginPage
