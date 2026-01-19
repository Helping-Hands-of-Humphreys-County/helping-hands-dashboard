import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiPost, apiPut } from '../api/http'
import type { AssistanceEventCreatePayload, AssistanceEventUpdatePayload } from '../types/assistance'

export function useAssistanceMutations() {
  const qc = useQueryClient()

  const create = useMutation({
    mutationFn: (payload: AssistanceEventCreatePayload) => apiPost<string>('/assistance-events', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assistance'] }),
  })

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AssistanceEventUpdatePayload }) =>
      apiPut<void>(`/assistance-events/${id}`, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['assistance'] })
      qc.invalidateQueries({ queryKey: ['assistance', 'details', vars.id] })
    },
  })

  // The server exposes archive/unarchive endpoints rather than DELETE
  const remove = useMutation({
    mutationFn: (id: string) => apiPost<void>(`/assistance-events/${id}/archive`),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['assistance'] })
      qc.invalidateQueries({ queryKey: ['assistance', 'details', id] })
    },
  })

  return { create, update, remove }
}