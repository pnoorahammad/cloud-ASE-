import React from 'react'
import { Table, TableHead, TableRow, TableCell, TableBody, Switch, IconButton, Tooltip } from '@mui/material'
import { ValidationRule } from '../types'
import RefreshIcon from '@mui/icons-material/Refresh'

interface Props {
  rules: ValidationRule[]
  onToggle: (rule: ValidationRule, next: boolean) => void
  onRefresh: () => void
}

const RulesTable: React.FC<Props> = ({ rules, onToggle, onRefresh }) => {
  return (
    <div>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Rule Name</TableCell>
            <TableCell>Object</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Error Message</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Last Modified</TableCell>
            <TableCell align="right">
              <Tooltip title="Refresh">
                <IconButton size="small" onClick={onRefresh}><RefreshIcon /></IconButton>
              </Tooltip>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rules.map(r => (
            <TableRow key={r.id} hover>
              <TableCell>{r.name}</TableCell>
              <TableCell>{r.objectName}</TableCell>
              <TableCell>{r.description}</TableCell>
              <TableCell>{r.errorMessage}</TableCell>
              <TableCell>{r.isPending ? (r.stagedActive ? 'Pending ON' : 'Pending OFF') : (r.active ? 'Active' : 'Inactive')}</TableCell>
              <TableCell>{r.lastModifiedDate ? new Date(r.lastModifiedDate).toLocaleString() : '-'}</TableCell>
              <TableCell align="right">
                <Switch checked={r.stagedActive ?? r.active} onChange={() => onToggle(r, !(r.stagedActive ?? r.active))} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default RulesTable
