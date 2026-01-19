import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../api/http'
import type { TableState } from './useTableState'
import { sortStateToApiParam } from '../components/table/sortTypes'
import type { HouseholdListResponse } from '../types/households'

export function useHouseholdsList(state: TableState) {
  const { debouncedSearch, page, pageSize, sort } = state

  return useQuery<HouseholdListResponse>({
    queryKey: ['households', { search: debouncedSearch, page, pageSize, sort }],
    queryFn: () => {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('pageSize', String(pageSize))
      if (debouncedSearch) params.set('search', debouncedSearch)
      const apiSort = sortStateToApiParam(sort)
      params.set('sort', apiSort ?? 'lastActivityAt')
      return apiGet<HouseholdListResponse>(`/households?${params.toString()}`)
    },
  })
}
