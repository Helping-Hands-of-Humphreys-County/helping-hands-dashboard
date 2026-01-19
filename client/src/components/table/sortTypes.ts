export type SortDir = 'asc' | 'desc' | null

export type SortState = {
  key: string | null
  dir: SortDir
}

export function nextSortForKey(current: SortState, key: string): SortState {
  if (current.key !== key || current.dir === null) return { key, dir: 'asc' }
  if (current.dir === 'asc') return { key, dir: 'desc' }
  return { key: null, dir: null }
}

export function sortStateToApiParam(sort: SortState): string | undefined {
  if (!sort.key || !sort.dir) return undefined
  return sort.dir === 'desc' ? `-${sort.key}` : sort.key
}

export function apiParamToSortState(param: string | null | undefined): SortState {
  if (!param) return { key: null, dir: null }
  if (param.startsWith('-') && param.length > 1) return { key: param.slice(1), dir: 'desc' }
  return { key: param, dir: 'asc' }
}
