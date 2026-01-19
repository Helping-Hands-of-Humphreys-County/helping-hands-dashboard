import Table from 'react-bootstrap/Table'
import Alert from 'react-bootstrap/Alert'
import Spinner from 'react-bootstrap/Spinner'
import type { SortState } from './sortTypes'
import { SortableTh } from './SortableTh'
import { useEffect, useRef, Fragment } from 'react'

export type DataTableColumn<TRow> = {
  label: string
  sortKey?: string
  render: (row: TRow) => React.ReactNode
  className?: string
}

export function DataTable<TRow>({
  columns,
  rows,
  getRowKey,
  sort,
  onSortChange,
  onRowClick,
  isLoading,
  error,
  emptyText = 'No results.',
  expandedRowId,
  renderExpandedRow,
}: {
  columns: Array<DataTableColumn<TRow>>
  rows: TRow[]
  getRowKey: (row: TRow) => string
  sort?: SortState
  onSortChange?: (next: SortState) => void
  onRowClick?: (row: TRow) => void
  isLoading?: boolean
  error?: unknown
  emptyText?: string
  expandedRowId?: string | null
  renderExpandedRow?: (row: TRow) => React.ReactNode
}) {
  const didApplyDefaultSort = useRef(false)

  useEffect(() => {
    if (didApplyDefaultSort.current) return
    if (!onSortChange) return
    if (sort && sort.key) return

    const preferredDateKeys = ['occurredAt', 'submittedAt', 'createdAt', 'updatedAt']
    for (const key of preferredDateKeys) {
      if (columns.some((c) => c.sortKey === key)) {
        onSortChange({ key, dir: 'desc' })
        didApplyDefaultSort.current = true
        break
      }
    }
  }, [columns, onSortChange, sort])
  if (isLoading) {
    return (
      <div className="py-3">
        <Spinner animation="border" size="sm" className="me-2" /> Loading…
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="danger" className="my-3">
        Failed to load.
      </Alert>
    )
  }

  if (!rows.length) {
    return <div className="py-3">{emptyText}</div>
  }

  return (
    <Table hover striped responsive>
      <thead>
        <tr>
          {columns.map((c) => {
            if (c.sortKey && onSortChange && sort) {
              return (
                <SortableTh
                  key={c.sortKey}
                  label={c.label}
                  sortKey={c.sortKey}
                  sort={sort}
                  onSortChange={onSortChange}
                />
              )
            }

            return (
              <th key={c.label} className={c.className}>
                {c.label}
              </th>
            )
          })}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <Fragment key={getRowKey(row)}>
            <tr
              key={getRowKey(row)}
              style={onRowClick ? { cursor: 'pointer' } : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((c) => (
                <td key={`${getRowKey(row)}:${c.label}`} className={c.className}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
            {renderExpandedRow && expandedRowId === getRowKey(row) ? (
              <tr>
                <td colSpan={columns.length}>{renderExpandedRow(row)}</td>
              </tr>
            ) : null}
          </Fragment>
        ))}
      </tbody>
    </Table>
  )
}
