import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { apiGet } from '../api/http'
import type { ApplicationDetails } from '../types/applications'

// Accept any options to allow passing lifecycle callbacks like onSuccess
export function useApplicationDetails(id: string | undefined, options?: any) {
  return useQuery({
    queryKey: ['applications', id],
    enabled: Boolean(id),
    queryFn: () => apiGet<ApplicationDetails>(`/applications/${id}`),
    refetchOnWindowFocus: false,
    ...options,
  })
}
