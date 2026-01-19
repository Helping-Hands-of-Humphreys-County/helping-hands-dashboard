import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiPost, apiPut } from '../api/http'

type HouseholdPayload = {
  street1: string
  street2?: string | null
  city: string
  state: string
  zip?: string | null
}

export function useHouseholdMutations() {
  const qc = useQueryClient()

  const create = useMutation({
    mutationFn: (payload: HouseholdPayload) => apiPost<string>('/households', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['households'] }),
  })

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: HouseholdPayload }) =>
      apiPut<void>(`/households/${id}`, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['households'] })
      qc.invalidateQueries({ queryKey: ['households', 'details', vars.id] })
    },
  })

  return { create, update }
}