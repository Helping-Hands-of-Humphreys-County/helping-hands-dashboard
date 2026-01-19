import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../api/http'
import type { HouseholdDetails } from '../types/households'

export function useHouseholdDetails(id: string | undefined, options?: any) {
  return useQuery({
    queryKey: ['households', 'details', id],
    enabled: Boolean(id),
    queryFn: () => apiGet<HouseholdDetails>(`/households/${id}`),
    refetchOnWindowFocus: false,
    ...options,
  })
}
