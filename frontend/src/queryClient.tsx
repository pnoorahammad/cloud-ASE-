import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const client = new QueryClient()

const QueryProvider: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
)

export default QueryProvider
