import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPut } from '../api/http'
import type { SiteInfo, UpdateSiteInfoRequest } from '../types/siteInfo'

export function useSiteInfo() {
  return useQuery({
    queryKey: ['site-info'],
    queryFn: () => apiGet<SiteInfo>('/site-info'),
  })
}

export function useSiteInfoMutations() {
  const qc = useQueryClient()

  const update = useMutation({
    mutationFn: (req: UpdateSiteInfoRequest) => apiPut<void>('/site-info', req),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['site-info'] })
    },
  })

  return { update }
}
