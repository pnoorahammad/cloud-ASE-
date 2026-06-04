import React from 'react'
import { Box, Select, MenuItem, IconButton } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'

interface Props { page: number, pageSize: number, total: number, onPageChange: (p:number)=>void, onPageSizeChange: (s:number)=>void }

const PaginationControls: React.FC<Props> = ({ page, pageSize, total, onPageChange, onPageSizeChange }) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <IconButton onClick={() => onPageChange(Math.max(1, page-1))}><ArrowBackIcon /></IconButton>
      <div>Page {page} / {totalPages}</div>
      <IconButton onClick={() => onPageChange(Math.min(totalPages, page+1))}><ArrowForwardIcon /></IconButton>
      <Select value={pageSize} size="small" onChange={(e)=>onPageSizeChange(Number(e.target.value))}>
        <MenuItem value={10}>10</MenuItem>
        <MenuItem value={25}>25</MenuItem>
        <MenuItem value={50}>50</MenuItem>
      </Select>
    </Box>
  )
}

export default PaginationControls
