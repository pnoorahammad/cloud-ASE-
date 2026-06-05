import React from 'react'
import {
  Drawer, List, ListItemButton, ListItemIcon, ListItemText, Box, Typography, Divider, Button
} from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PendingActionsIcon from '@mui/icons-material/PendingActions'
import HistoryIcon from '@mui/icons-material/History'
import PersonIcon from '@mui/icons-material/Person'
import CloudIcon from '@mui/icons-material/Cloud'
import LogoutIcon from '@mui/icons-material/Logout'
import { useNavigate, useLocation } from 'react-router-dom'
import { getApiBase } from '../services/api'

const WIDTH = 240

interface Props {
  user: any
  onLogout: () => void
}

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { path: '/pending', label: 'Pending Changes', icon: <PendingActionsIcon /> },
  { path: '/history', label: 'Deployment History', icon: <HistoryIcon /> },
  { path: '/profile', label: 'Profile & Settings', icon: <PersonIcon /> }
]

const Sidebar: React.FC<Props> = ({ user, onLogout }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const base = getApiBase()

  const connectSalesforce = () => {
    window.location.href = `${base}/auth/login?redirect=true`
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width: WIDTH, boxSizing: 'border-box', pt: 1 }
      }}
    >
      <Box sx={{ px: 2, py: 2 }}>
        <Typography variant="subtitle1" fontWeight={700}>Rule Manager</Typography>
        {user?.email && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            {user.email}
          </Typography>
        )}
        {user?.fullName && (
          <Typography variant="body2" sx={{ mt: 0.5 }}>{user.fullName}</Typography>
        )}
      </Box>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItemButton
            key={item.path}
            selected={location.pathname === item.path}
            onClick={() => navigate(item.path)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
      <Divider />
      <Box sx={{ px: 2, py: 2 }}>
        {!user?.salesforceConnected && (
          <Button
            fullWidth
            variant="outlined"
            startIcon={<CloudIcon />}
            onClick={connectSalesforce}
            sx={{ mb: 1 }}
          >
            Connect Salesforce
          </Button>
        )}
        <Button fullWidth color="inherit" startIcon={<LogoutIcon />} onClick={onLogout}>
          Sign Out
        </Button>
      </Box>
    </Drawer>
  )
}

export default Sidebar
export const SIDEBAR_WIDTH = WIDTH
