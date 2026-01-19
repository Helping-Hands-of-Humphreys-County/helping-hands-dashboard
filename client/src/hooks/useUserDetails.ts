import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../api/http'
import type { UserDetails } from '../types/users'

export function useUserDetails(id: string | undefined) {
  return useQuery<UserDetails>({
    queryKey: ['users', id],
    enabled: Boolean(id),
    queryFn: () => apiGet<UserDetails>(`/users/${id}`),
  })
}
