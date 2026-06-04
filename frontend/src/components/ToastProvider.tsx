import React from 'react'
import { SnackbarProvider } from 'notistack'

const ToastProvider: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <SnackbarProvider maxSnack={4}>{children}</SnackbarProvider>
)

export default ToastProvider
