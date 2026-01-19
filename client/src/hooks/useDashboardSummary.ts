import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../api/http'
import type { DashboardSummary } from '../types/dashboard'

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => apiGet<DashboardSummary>('/dashboard/summary'),
  })
}