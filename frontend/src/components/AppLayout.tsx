import React from 'react'
import { Box, AppBar, Toolbar, Typography, IconButton, Switch } from '@mui/material'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
import Sidebar from './Sidebar'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { CircularProgress } from '@mui/material'

interface Props {
  children: React.ReactNode
  dark: boolean
  setDark: (d: boolean) => void
}

const AppLayout: React.FC<Props> = ({ children, dark, setDark }) => {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!user) {
    navigate('/login', { replace: true })
    return null
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar user={user} onLogout={handleLogout} />
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <AppBar position="static" elevation={0} sx={{ ml: 0 }}>
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Validation Rule Manager
            </Typography>
            <IconButton color="inherit" onClick={() => setDark(!dark)}>
              {dark ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
            <Switch checked={dark} onChange={(e) => setDark(e.target.checked)} color="default" />
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ flexGrow: 1, p: 3, minWidth: 0 }}>
          {children}
        </Box>
      </Box>
    </Box>
  )
}

export default AppLayout
