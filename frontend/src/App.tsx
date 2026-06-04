import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import PendingChanges from './pages/PendingChanges'
import DeploymentHistory from './pages/DeploymentHistory'
import ProfilePage from './pages/ProfilePage'
import QueryProvider from './queryClient'
import AppLayout from './components/AppLayout'
import { ThemeProvider, createTheme } from '@mui/material'
import { useState } from 'react'
import ErrorBoundary from './ErrorBoundary'

const App: React.FC = () => {
  const [dark, setDark] = useState(() => localStorage.getItem('prefersDark') === 'true')
  const theme = createTheme({ palette: { mode: dark ? 'dark' : 'light' } })

  const setDarkAndPersist = (d: boolean) => {
    setDark(d)
    localStorage.setItem('prefersDark', String(d))
  }

  const layout = (page: React.ReactNode) => (
    <AppLayout dark={dark} setDark={setDarkAndPersist}>{page}</AppLayout>
  )

  return (
    <QueryProvider>
      <ThemeProvider theme={theme}>
        <ErrorBoundary>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={layout(<Dashboard />)} />
            <Route path="/pending" element={layout(<PendingChanges />)} />
            <Route path="/history" element={layout(<DeploymentHistory />)} />
            <Route path="/profile" element={layout(<ProfilePage />)} />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </ErrorBoundary>
      </ThemeProvider>
    </QueryProvider>
  )
}

export default App
