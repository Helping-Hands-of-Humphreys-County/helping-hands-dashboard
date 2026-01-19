import Container from 'react-bootstrap/Container'
import Badge from 'react-bootstrap/Badge'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '../components/table/DataTable'
import { TableToolbar } from '../components/table/TableToolbar'
import { PaginationBar } from '../components/table/PaginationBar'
import { useTableState } from '../hooks/useTableState'
import { useClientsList } from '../hooks/useClientsList'
import type { ClientListItem } from '../types/clients'

export function ClientsList() {
  const table = useTableState()
  const navigate = useNavigate()
  const { data, isLoading, error } = useClientsList(table)

  const rows = data?.items ?? []

  return (
    <Container className="py-3">
      <h1 className="h4 mb-0">Clients</h1>
      <div className="text-muted small mb-3">Search by name or address to find clients quickly.</div>

      <TableToolbar
        search={table.search}
        onSearchChange={table.setSearch}
        onSearchClear={() => table.setSearch('')}
        placeholder="Search clients"
      />

      <DataTable<ClientListItem>
        columns={[
          {
            label: 'Name',
            sortKey: 'lastName',
            render: (row) => (
              <div>
                <div className="fw-semibold">{row.lastName}, {row.firstName}</div>
                {row.dob ? <div className="text-muted small">DOB: {new Date(row.dob).toLocaleDateString()}</div> : null}
              </div>
            ),
          },
          {
            label: 'Contact',
            render: (row) => (
              <div className="text-muted small">{row.phone ?? '—'}</div>
            ),
          },
          {
            label: 'Address',
            render: (row) => (
              <div>
                <div className="fw-semibold">{row.street1 ?? '—'}</div>
                <div className="text-muted small">
                  {row.city ?? ''} {row.state ?? ''} {row.zip ?? ''}
                </div>
              </div>
            ),
          },
          {
            label: 'Status',
            render: () => <Badge bg="success">Active</Badge>,
            className: 'text-nowrap',
          },
        ]}
        rows={rows}
        getRowKey={(row) => row.id}
        sort={table.sort}
        onSortChange={table.setSort}
        onRowClick={(row) => navigate(`/clients/${row.id}`)}
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