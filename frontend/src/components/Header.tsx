import React from 'react'
import { AppBar, Toolbar, Typography, IconButton, Switch, Button } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'

interface Props { dark: boolean, setDark: (d: boolean) => void }

const Header: React.FC<Props> = ({ dark, setDark }) => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>Validation Rule Manager</Typography>
        <Button color="inherit" component={RouterLink} to="/dashboard">Dashboard</Button>
        <Button color="inherit" component={RouterLink} to="/pending">Pending</Button>
        <Button color="inherit" component={RouterLink} to="/history">History</Button>
        <IconButton color="inherit" onClick={() => setDark(!dark)}>
          {dark ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
        <Switch checked={dark} onChange={(e) => setDark(e.target.checked)} color="default" />
      </Toolbar>
    </AppBar>
  )
}

export default Header
