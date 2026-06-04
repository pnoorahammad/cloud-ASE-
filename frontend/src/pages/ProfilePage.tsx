import React, { useState, useEffect } from 'react'
import {
  Paper, Typography, TextField, Button, Box, Alert, Grid
} from '@mui/material'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { useSnackbar } from 'notistack'

const ProfilePage: React.FC = () => {
  const { user, refresh } = useAuth()
  const { enqueueSnackbar } = useSnackbar()

  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setEmail(user.email || '')
      setFullName(user.fullName || user.username || '')
    }
  }, [user])

  const saveProfile = async () => {
    try {
      setSaving(true)
      setMsg(null)
      await api.put('/auth/profile', { email, fullName })
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
            <TextField
              fullWidth
              label="Email (Gmail)"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              disabled={!isLocal}
            />
            <TextField
              fullWidth
              label="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              margin="normal"
              disabled={!isLocal}
            />
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
