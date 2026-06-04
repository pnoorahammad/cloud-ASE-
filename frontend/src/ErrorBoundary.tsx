import React from 'react'
import { Typography, Container } from '@mui/material'

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props:any){ super(props); this.state = { hasError: false } }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(error:any, info:any) { console.error('Unhandled render error', error, info) }
  render(){
    if (this.state.hasError) return (<Container><Typography variant="h6">An unexpected error occurred</Typography></Container>)
    return this.props.children
  }
}

export default ErrorBoundary
