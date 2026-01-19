import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { apiGet } from '../api/http'
import type { ClientDetails } from '../types/clients'

type ClientDetailsQueryOptions = Omit<
  UseQueryOptions<ClientDetails, Error, ClientDetails, ['clients', string | undefined]>,
  'queryKey' | 'queryFn' | 'enabled'
>

export function useClientDetails(id: string | undefined, options?: ClientDetailsQueryOptions) {
  return useQuery({
    queryKey: ['clients', id],
    enabled: Boolean(id),
    queryFn: () => apiGet<ClientDetails>(`/clients/${id}`),
    refetchOnWindowFocus: false,
    ...options,
  })
}
