import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiPost, apiPut } from '../api/http'
import type { CreateUserPayload, UpdateUserPayload } from '../types/users'

export function useUserMutations() {
  const qc = useQueryClient()

  const create = useMutation({
    mutationFn: (payload: CreateUserPayload) => apiPost<{ id: string; inviteToken?: string }>('/users', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) =>
      apiPut<void>(`/users/${id}`, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['users'] })
      qc.invalidateQueries({ queryKey: ['users', vars.id] })
    },
  })

  const activate = useMutation({
    mutationFn: (id: string) => apiPost<void>(`/users/${id}/activate`),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['users'] })
      qc.invalidateQueries({ queryKey: ['users', id] })
    },
  })

  const deactivate = useMutation({
    mutationFn: (id: string) => apiPost<void>(`/users/${id}/deactivate`),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['users'] })
      qc.invalidateQueries({ queryKey: ['users', id] })
    },
  })

  return { create, update, activate, deactivate }
}
