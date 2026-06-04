import React, { useEffect, useState } from 'react'
import { Container, Paper, Typography, List, ListItem, ListItemText } from '@mui/material'
import api from '../services/api'

const DeploymentHistory: React.FC = () => {
  const [history, setHistory] = useState<any[]>([])

  const load = async () => {
    const resp = await api.get('/deploy/audit-logs')
    setHistory(resp.data || [])
  }

  useEffect(() => { load() }, [])

  return (
    <Container>
      <Typography variant="h5" sx={{ mt: 2 }}>Deployment History</Typography>
      <Paper sx={{ p:2, mt:2 }}>
        {history.length === 0 ? (
          <Typography>No Deployment History</Typography>
        ) : (
          <List>
            {history.map(h => (
              <ListItem key={h._id || h.id}>
                <ListItemText primary={`${h.action} • ${h.status}`} secondary={`${new Date(h.timestamp).toLocaleString()} • ${h.affectedRules?.join(', ')}`} />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Container>
  )
}

export default DeploymentHistory
