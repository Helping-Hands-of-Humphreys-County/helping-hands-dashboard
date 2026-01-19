import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../api/http'
import type { TableState } from './useTableState'
import { sortStateToApiParam } from '../components/table/sortTypes'
import type { ClientListResponse } from '../types/clients'

export function useClientsList(state: TableState) {
  const { debouncedSearch, page, pageSize, sort } = state

  return useQuery<ClientListResponse>({
    queryKey: ['clients', { search: debouncedSearch, page, pageSize, sort }],
    queryFn: () => {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('pageSize', String(pageSize))
      if (debouncedSearch) params.set('search', debouncedSearch)
      const apiSort = sortStateToApiParam(sort)
      if (apiSort) params.set('sort', apiSort)
      return apiGet<ClientListResponse>(`/clients?${params.toString()}`)
    },
  })
}