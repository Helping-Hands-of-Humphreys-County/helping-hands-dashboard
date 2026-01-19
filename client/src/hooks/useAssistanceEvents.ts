import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../api/http'
import type { TableState } from './useTableState'
import { sortStateToApiParam } from '../components/table/sortTypes'
import type { AssistanceEventListResponse } from '../types/assistance'

export function useAssistanceEvents(
  state: TableState,
  filters?: { programType?: string; from?: string; to?: string },
) {
  const { debouncedSearch, page, pageSize, sort } = state
  const { programType, from, to } = filters ?? {}

  return useQuery<AssistanceEventListResponse>({
    queryKey: ['assistance', { search: debouncedSearch, page, pageSize, sort, programType, from, to }],
    queryFn: () => {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('pageSize', String(pageSize))
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (programType) params.set('programType', programType)
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      const apiSort = sortStateToApiParam(sort)
      if (apiSort) params.set('sort', apiSort)
      return apiGet<AssistanceEventListResponse>(`/assistance-events?${params.toString()}`)
    },
  })
}