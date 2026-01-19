import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiPost, apiPut } from '../api/http'

export type ClientNoteCreatePayload = {
  body: string
}

export type ClientNoteUpdatePayload = {
  body: string
}

export function useClientNoteMutations(clientId: string | undefined) {
  const queryClient = useQueryClient()

  const invalidate = () => {
    if (!clientId) return
    void queryClient.invalidateQueries({ queryKey: ['clients', clientId] })
  }

  const create = useMutation<string, unknown, ClientNoteCreatePayload>({
    mutationFn: (payload) => {
      if (!clientId) return Promise.reject(new Error('Missing client id'))
      return apiPost<string>(`/clients/${clientId}/notes`, payload)
    },
    onSuccess: invalidate,
  })

  const update = useMutation<void, unknown, { noteId: string; payload: ClientNoteUpdatePayload}>({
    mutationFn: ({ noteId, payload }) => {
      if (!clientId) return Promise.reject(new Error('Missing client id'))
      return apiPut<void>(`/clients/${clientId}/notes/${noteId}`, payload)
    },
    onSuccess: invalidate,
  })

  const remove = useMutation<void, unknown, { noteId: string }>({
    mutationFn: ({ noteId }) => {
      if (!clientId) return Promise.reject(new Error('Missing client id'))
      return apiPost<void>(`/clients/${clientId}/notes/${noteId}/delete`)
    },
    onSuccess: invalidate,
  })

  return { create, update, remove }
}
