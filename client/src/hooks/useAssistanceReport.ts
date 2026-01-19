import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../api/http'
import type { ReportResponse } from '../types/reporting'

export function useAssistanceReport({ program, from, to }: { program: string; from: string; to: string }) {
  return useQuery({
    queryKey: ['reporting', program, { from, to }],
    queryFn: () => apiGet<ReportResponse>(`/reports?program=${encodeURIComponent(program)}&from=${from}&to=${to}`),
    enabled: Boolean(program && from && to),
  })
}