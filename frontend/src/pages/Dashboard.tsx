import React, { useEffect, useState } from 'react'
import { Box, Typography, Button, Paper, Grid, Divider, Alert } from '@mui/material'
import api from '../services/api'
import RulesTable from '../components/RulesTable'
import { ValidationRule, UserProfile } from '../types'
import { useAuth } from '../hooks/useAuth'
import { useSnackbar } from 'notistack'
import SearchBar from '../components/SearchBar'
import PaginationControls from '../components/PaginationControls'
import { useQuery } from '@tanstack/react-query'


const Dashboard: React.FC = () => {
  const { user: sessionUser, loading: authLoading } = useAuth()
  const sfConnected = sessionUser?.salesforceConnected !== false && (sessionUser?.salesforceConnected || sessionUser?.authType === 'salesforce' || !!sessionUser?.username)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [org, setOrg] = useState<any>(null)
  const [rules, setRules] = useState<ValidationRule[]>([])
  
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [total, setTotal] = useState(0)

  const rulesQuery = useQuery({
    queryKey: ['rules', q, page, pageSize],
    queryFn: async () => {
      const resp = await api.get('/validation-rules', { params: { q, page, pageSize, sortBy: 'objectName', sortDir: 'asc' } })
      return resp.data
    },
    enabled: !!sessionUser && !authLoading && sfConnected
  })

  const { enqueueSnackbar } = useSnackbar()

  const deployQuery = useQuery({
    queryKey: ['deployStatus'],
    queryFn: async () => {
      const r = await api.get('/deploy/status')
      return r.data
    },
    enabled: !!sessionUser && !authLoading && sfConnected,
    refetchInterval: (query) => {
      const data = query.state.data as any
      if (!data || data.isFinished) return false
      return 5000
    }
  })

  useEffect(() => {
    if (!deployQuery.data) return
    const d = deployQuery.data as any
    if (!d) return
    if (!d.isFinished && d.progress > 0) {
      enqueueSnackbar(`Deployment in progress: ${d.progress}%`, { variant: 'info' })
    }
    if (d.isFinished && d.success) {
      enqueueSnackbar('Deployment completed successfully', { variant: 'success' })
      rulesQuery.refetch()
    }
    if (d.isFinished && !d.success) {
      enqueueSnackbar('Deployment finished with errors; check logs', { variant: 'error' })
    }
  }, [deployQuery.data])

  useEffect(() => {
    const data:any = rulesQuery.data
    if (data) {
      setRules(data.rules || [])
      setTotal(data.total || 0)
    }
  }, [rulesQuery.data])

  const loadAll = async () => {
    try {
      const [uRes, oRes] = await Promise.all([api.get('/user'), api.get('/org')])
      setUser(uRes.data)
      setOrg(oRes.data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (sessionUser && sfConnected) loadAll()
  }, [sessionUser, sfConnected])

  const handleToggle = async (rule: ValidationRule, next: boolean) => {
    try {
      await api.put(`/validation-rules/${rule.id}`, { active: next, fullName: rule.fullName, originalActive: rule.active, name: rule.name, objectName: rule.objectName, description: rule.description, errorMessage: rule.errorMessage, errorDisplayField: rule.errorDisplayField })
      // refetch rules
      await rulesQuery.refetch()
    } catch (err) { console.error(err) }
  }

  const handleDeploy = async () => {
    try {
      const resp = await api.post('/deploy')
      enqueueSnackbar(resp.data?.message || 'Deployment queued', { variant: 'info' })
      rulesQuery.refetch()
      deployQuery.refetch()
    } catch (err: any) { console.error(err); enqueueSnackbar(err?.response?.data?.error || 'Failed to start deployment', { variant: 'error' }) }
  }

  return (
    <Box>
        {!sfConnected && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Connect Salesforce from the sidebar to load validation rules and deploy changes.
          </Alert>
        )}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs>
            <Typography variant="h5">Dashboard</Typography>
            {(user || sessionUser) && (
              <Typography variant="body2">
                {(user?.fullName || sessionUser?.fullName)} • {(user?.email || sessionUser?.email || user?.username || sessionUser?.username)}
              </Typography>
            )}
            {org && <Typography variant="body2">{org.orgName} • {org.instanceUrl}</Typography>}
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}><SearchBar onSearch={(v)=>{ setQ(v); setPage(1) }} /></Grid>
            <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button variant="contained" onClick={handleDeploy}>Deploy Pending Changes</Button>
              <Button variant="outlined" onClick={() => { rulesQuery.refetch(); loadAll() }}>Refresh</Button>
            </Grid>
          </Grid>
          <Box sx={{ mt: 1 }}>
            <Typography>Total rules: {total}</Typography>
            <Typography>Pending staged: {rules.filter(r => r.isPending).length}</Typography>
          </Box>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <RulesTable rules={rules} onToggle={handleToggle} onRefresh={() => rulesQuery.refetch()} />
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <PaginationControls page={page} pageSize={pageSize} total={total} onPageChange={(p)=>{ setPage(p); rulesQuery.refetch() }} onPageSizeChange={(s)=>{ setPageSize(s); setPage(1); rulesQuery.refetch() }} />
            <Box sx={{ ml: 2, textAlign: 'right' }}>
              {deployQuery.data && (
                <div>
                  <Typography variant="body2">Deployment: {deployQuery.data.isFinished ? (deployQuery.data.success ? 'Completed' : 'Failed') : `In Progress (${deployQuery.data.progress}%)`}</Typography>
                  <Typography variant="caption">Started: {deployQuery.data.startTime ? new Date(deployQuery.data.startTime).toLocaleString() : '-'}</Typography>
                  {deployQuery.data.logs && deployQuery.data.logs.length > 0 && (
                    <Box sx={{ mt: 1, maxHeight: 120, overflow: 'auto', background: 'rgba(0,0,0,0.03)', p:1 }}>
                      {deployQuery.data.logs.slice(-5).map((l:any,idx:number)=> (
                        <div key={idx}><strong>[{l.status}]</strong> {l.message}</div>
                      ))}
                    </Box>
                  )}
                </div>
              )}
            </Box>
          </Box>
        </Paper>
    </Box>
  )
}

export default Dashboard
