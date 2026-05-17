import { useMemo } from 'react'
import type { UserMatchHistoryRow } from '../services/apiUser.ts'

type FilterStatus = 'all' | 'wins' | 'losses' | 'pending'

interface FilterResult {
  filteredRows: UserMatchHistoryRow[]
  pendingCount: number
}

export function useFilterHistorialLakers(
  rows: UserMatchHistoryRow[],
  filterStatus: FilterStatus,
  searchText: string,
): FilterResult {
  const filteredRows = useMemo(() => {
    let result = rows

    // Filtrar por status
    if (filterStatus === 'wins') {
      result = result.filter((row) => row.result === true)
    } else if (filterStatus === 'losses') {
      result = result.filter((row) => row.result === false)
    } else if (filterStatus === 'pending') {
      result = result.filter((row) => row.result === null)
    }

    // Filtrar por búsqueda (event name o court name)
    if (searchText.trim()) {
      const query = searchText.toLowerCase()
      result = result.filter(
        (row) =>
          row.event_name?.toLowerCase().includes(query) ||
          row.court_name?.toLowerCase().includes(query),
      )
    }

    return result
  }, [rows, filterStatus, searchText])

  // Contar pendientes (siempre del total, no de filtrados)
  const pendingCount = useMemo(() => {
    return rows.filter((row) => row.result === null).length
  }, [rows])

  return { filteredRows, pendingCount }
}
