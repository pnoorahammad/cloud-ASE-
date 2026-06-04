import React, { useState, useEffect } from 'react'
import { TextField, InputAdornment } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import debounce from 'lodash.debounce'

interface Props { onSearch: (q: string) => void }

const SearchBar: React.FC<Props> = ({ onSearch }) => {
  const [value, setValue] = useState('')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debounced = React.useCallback(debounce((v:string) => onSearch(v), 400), [onSearch])

  useEffect(() => {
    debounced(value)
    return () => { debounced.cancel() }
  }, [value, debounced])

  return (
    <TextField
      size="small"
      fullWidth
      placeholder="Search rules or objects..."
      value={value}
      onChange={(e) => setValue(e.target.value)}
      InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }}
    />
  )
}

export default SearchBar
