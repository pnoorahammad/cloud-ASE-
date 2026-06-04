import React, { useEffect, useState } from 'react'
import { Container, Paper, Typography, List, ListItem, ListItemText, IconButton, Button } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import api from '../services/api'
import { useSnackbar } from 'notistack'

const PendingChanges: React.FC = () => {
  const [pending, setPending] = useState<any[]>([])

  const load = async () => {
    const resp = await api.get('/validation-rules/pending')
    setPending(resp.data.pending || [])
  }

  useEffect(() => { load() }, [])

  const remove = async (fullName:string) => {
    await api.delete(`/validation-rules/pending/${encodeURIComponent(fullName)}`)
    load()
  }

  const deploy = async () => {
    try {
      const resp = await api.post('/deploy')
      enqueueSnackbar(resp.data?.message || 'Deployment queued', { variant: 'info' })
      load()
    } catch (err:any) {
      enqueueSnackbar(err?.response?.data?.error || 'Failed to start deployment', { variant: 'error' })
    }
  }

  const { enqueueSnackbar } = useSnackbar()

  return (
    <Container>
      <Typography variant="h5" sx={{ mt:2 }}>Pending Changes</Typography>
      <Paper sx={{ p:2, mt:2 }}>
        {pending.length === 0 ? (
          <Typography>No Pending Changes</Typography>
        ) : (
          <>
            <List>
              {pending.map(p => (
                <ListItem key={p.fullName} secondaryAction={<IconButton onClick={() => remove(p.fullName)}><DeleteIcon/></IconButton>}>
                  <ListItemText primary={p.fullName} secondary={`Current: ${p.originalActive} → New: ${p.active} • ${new Date(p.timestamp).toLocaleString()}`} />
                </ListItem>
              ))}
            </List>
            <Button variant="contained" onClick={deploy}>Deploy Pending</Button>
          </>
        )}
      </Paper>
    </Container>
  )
}

export default PendingChanges
