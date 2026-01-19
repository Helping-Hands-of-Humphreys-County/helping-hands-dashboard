import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiPost, apiPut } from '../api/http'
type UpsertClient = {
  householdId?: string | null
  firstName: string
  lastName: string
  dob?: string | null
  phone?: string | null
}

export function useClientMutations() {
  const qc = useQueryClient()

  const create = useMutation({
    mutationFn: (payload: UpsertClient) => apiPost<string>('/clients', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  })

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpsertClient }) => apiPut<void>(`/clients/${id}`, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      qc.invalidateQueries({ queryKey: ['clients', vars.id] })
    },
  })

  return { create, update }
}