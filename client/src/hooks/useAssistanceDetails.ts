import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../api/http'
import type { AssistanceEventDetails } from '../types/assistance'

export function useAssistanceDetails(id?: string, options?: any) {
  return useQuery({
    queryKey: ['assistance', 'details', id],
    queryFn: () => apiGet<AssistanceEventDetails>(`/assistance-events/${id}`),
    enabled: Boolean(id),
    refetchOnWindowFocus: false,
    ...options,
  })
}