import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiPost, apiPut } from '../api/http'
import type {
  ApplicationBothCreatePayload,
  ApplicationCreatePayload,
  ApplicationUpdatePayload,
  CreateBothApplicationsResponse,
} from '../types/applications'

export function useApplicationMutations() {
  const qc = useQueryClient()

  const create = useMutation({
    mutationFn: (payload: ApplicationCreatePayload) => apiPost<string>('/applications', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] }),
  })

  const createBoth = useMutation({
    mutationFn: (payload: ApplicationBothCreatePayload) => apiPost<CreateBothApplicationsResponse>('/applications/both', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] }),
  })

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ApplicationUpdatePayload }) =>
      apiPut<void>(`/applications/${id}`, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['applications'] })
      qc.invalidateQueries({ queryKey: ['applications', vars.id] })
    },
  })

  return { create, createBoth, update }
}