import React, { useState, useEffect } from 'react'
import {
  Paper, Typography, TextField, Button, Box, Alert, Grid, MenuItem, Select, FormControl, InputLabel
} from '@mui/material'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { useSnackbar } from 'notistack'

const ProfilePage: React.FC = () => {
  const { user, refresh } = useAuth()
  const { enqueueSnackbar } = useSnackbar()

  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [emailAddress, setEmailAddress] = useState('')
  const [jobRole, setJobRole] = useState('')
  const [company, setCompany] = useState('')
  const [country, setCountry] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setEmail(user.email || '')
      setFullName(user.fullName || '')
      setFirstName(user.firstName || '')
      setLastName(user.lastName || '')
      setEmailAddress(user.emailAddress || '')
      setJobRole(user.jobRole || '')
      setCompany(user.company || '')
      setCountry(user.country || '')
      setPostalCode(user.postalCode || '')
    }
  }, [user])

  const saveProfile = async () => {
    try {
      setSaving(true)
      setMsg(null)
      const computedFullName = `${firstName.trim()} ${lastName.trim()}`
      await api.put('/auth/profile', {
        email,
        fullName: computedFullName || fullName,
        firstName,
        lastName,
        emailAddress,
        jobRole,
        company,
        country,
        postalCode
      })
      await refresh()
      enqueueSnackbar('Profile saved', { variant: 'success' })
      setMsg('Profile saved successfully.')
    } catch (err: any) {
      setMsg(err.response?.data?.error || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const savePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMsg('New passwords do not match')
      return
    }
    try {
      setSaving(true)
      setMsg(null)
      await api.put('/auth/password', { currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      enqueueSnackbar('Password updated', { variant: 'success' })
      setMsg('Password changed successfully.')
    } catch (err: any) {
      setMsg(err.response?.data?.error || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  const isLocal = user?.hasLocalAccount || user?.authType === 'local'

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Profile & Settings</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Your email and password are saved securely. Use Gmail or any email to sign in.
      </Typography>

      {msg && <Alert severity={msg.includes('success') ? 'success' : 'error'} sx={{ mb: 2 }}>{msg}</Alert>}

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Account details</Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={!isLocal}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={!isLocal}
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email (Username)"
                  value={email}
                  disabled
                  size="small"
                  helperText="Username cannot be changed."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Contact Email Address"
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  disabled={!isLocal}
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth size="small" disabled={!isLocal}>
                  <InputLabel id="profile-job-role-label">Job Role</InputLabel>
                  <Select
                    labelId="profile-job-role-label"
                    label="Job Role"
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value as string)}
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
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  disabled={!isLocal}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" disabled={!isLocal}>
                  <InputLabel id="profile-country-label">Country/Region</InputLabel>
                  <Select
                    labelId="profile-country-label"
                    label="Country/Region"
                    value={country}
                    onChange={(e) => setCountry(e.target.value as string)}
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
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  disabled={!isLocal}
                  size="small"
                />
              </Grid>
            </Grid>
            {user?.salesforceConnected && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Salesforce connected: {user.username || 'Connected'}
              </Alert>
            )}
            {isLocal && (
              <Button variant="contained" onClick={saveProfile} disabled={saving} sx={{ mt: 2 }}>
                Save profile
              </Button>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Change password</Typography>
            <TextField
              fullWidth
              label="Current password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              margin="normal"
            />
            <TextField
              fullWidth
              label="New password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Confirm new password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              margin="normal"
            />
            <Button variant="contained" onClick={savePassword} disabled={saving || !isLocal} sx={{ mt: 2 }}>
              Update password
            </Button>
            {!isLocal && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                Sign up with email first to change password here.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default ProfilePage
