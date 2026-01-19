import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../api/http'
import type { TableState } from './useTableState'
import { sortStateToApiParam } from '../components/table/sortTypes'
import type { ApplicationListResponse } from '../types/applications'

export function useApplicationsList(
  state: TableState,
  filters?: { programType?: string; status?: string; from?: string; to?: string },
) {
  const { debouncedSearch, page, pageSize, sort } = state
  const { programType, status, from, to } = filters ?? {}

  return useQuery<ApplicationListResponse>({
    queryKey: ['applications', { search: debouncedSearch, page, pageSize, sort, programType, status, from, to }],
    queryFn: () => {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('pageSize', String(pageSize))
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (programType) params.set('programType', programType)
      if (status) params.set('status', status)
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      const apiSort = sortStateToApiParam(sort)
      if (apiSort) params.set('sort', apiSort)
      return apiGet<ApplicationListResponse>(`/applications?${params.toString()}`)
    },
  })
}