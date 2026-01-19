import Container from 'react-bootstrap/Container'
import Badge from 'react-bootstrap/Badge'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '../components/table/DataTable'
import { TableToolbar } from '../components/table/TableToolbar'
import { PaginationBar } from '../components/table/PaginationBar'
import { useTableState } from '../hooks/useTableState'
import { useHouseholdsList } from '../hooks/useHouseholdsList'
import type { HouseholdListItem } from '../types/households'

export function HouseholdsList() {
  const table = useTableState()
  const navigate = useNavigate()
  const { data, isLoading, error } = useHouseholdsList(table)

  const rows = data?.items ?? []

  return (
    <Container className="py-3">
      <h1 className="h4 mb-0">Households</h1>
      <div className="text-muted mb-3 small">Search by address or member name; last activity reflects assistance or application activity.</div>

      <TableToolbar
        search={table.search}
        onSearchChange={table.setSearch}
        onSearchClear={() => table.setSearch('')}
        placeholder="Search households"
      />

      <DataTable<HouseholdListItem>
        columns={[
          {
            label: 'Address',
            sortKey: 'street1',
            render: (row) => (
              <div>
                <div className="fw-semibold">{row.street1}</div>
                <div className="text-muted small">
                  {row.city}, {row.state} {row.zip ?? ''}
                </div>
              </div>
            ),
          },
          {
            label: 'Members',
            sortKey: 'memberCount',
            render: (row) => <Badge bg="secondary">{row.memberCount}</Badge>,
            className: 'text-nowrap',
          },
          {
            label: 'Last activity',
            sortKey: 'lastActivityAt',
            render: (row) => (row.lastActivityAt ? new Date(row.lastActivityAt).toLocaleString() : '—'),
            className: 'text-nowrap',
          },
        ]}
        rows={rows}
        getRowKey={(row) => row.id}
        sort={table.sort}
        onSortChange={table.setSort}
        onRowClick={(row) => navigate(`/households/${row.id}`)}
        isLoading={isLoading}
        error={error}
      />

      {data ? (
        <PaginationBar
          page={table.page}
          pageSize={table.pageSize}
          total={data.totalCount}
          onPageChange={table.setPage}
        />
      ) : null}
    </Container>
  )
}
