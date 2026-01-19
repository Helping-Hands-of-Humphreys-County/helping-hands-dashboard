import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { SortState } from '../components/table/sortTypes'
import { apiParamToSortState, sortStateToApiParam } from '../components/table/sortTypes'
import { useDebouncedValue } from './useDebouncedValue'

export type TableState = {
  search: string
  debouncedSearch: string
  page: number
  pageSize: number
  sort: SortState
  setSearch: (v: string) => void
  setPage: (v: number) => void
  setPageSize: (v: number) => void
  setSort: (v: SortState) => void
}

function toInt(value: string | null, fallback: number): number {
  const n = value ? Number.parseInt(value, 10) : Number.NaN
  return Number.isFinite(n) && n > 0 ? n : fallback
}

export function useTableState({
  defaultPageSize = 25,
  debounceMs = 250,
}: {
  defaultPageSize?: number
  debounceMs?: number
} = {}): TableState {
  const [params, setParams] = useSearchParams()

  const initialSearch = params.get('search') ?? ''
  const initialPage = toInt(params.get('page'), 1)
  const initialPageSize = toInt(params.get('pageSize'), defaultPageSize)
  const initialSort = apiParamToSortState(params.get('sort'))

  const [search, setSearchState] = useState(initialSearch)
  const [page, setPageState] = useState(initialPage)
  const [pageSize, setPageSizeState] = useState(initialPageSize)
  const [sort, setSortState] = useState<SortState>(initialSort)

  const debouncedSearch = useDebouncedValue(search, debounceMs)

  const setSearch = (v: string) => {
    setSearchState(v)
    setPageState(1)
    const next = new URLSearchParams(params)
    if (v) next.set('search', v)
    else next.delete('search')
    next.set('page', '1')
    setParams(next)
  }

  const setPage = (v: number) => {
    setPageState(v)
    const next = new URLSearchParams(params)
    next.set('page', String(v))
    setParams(next)
  }

  const setPageSize = (v: number) => {
    setPageSizeState(v)
    setPageState(1)
    const next = new URLSearchParams(params)
    next.set('pageSize', String(v))
    next.set('page', '1')
    setParams(next)
  }

  const setSort = (v: SortState) => {
    setSortState(v)
    const next = new URLSearchParams(params)
    const apiSort = sortStateToApiParam(v)
    if (apiSort) next.set('sort', apiSort)
    else next.delete('sort')
    setParams(next)
  }

  return {
    search,
    debouncedSearch,
    page,
    pageSize,
    sort,
    setSearch,
    setPage,
    setPageSize,
    setSort,
  }
}
