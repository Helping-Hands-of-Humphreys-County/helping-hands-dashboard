import { useState } from 'react'
import Badge from 'react-bootstrap/Badge'
import Button from 'react-bootstrap/Button'
import Container from 'react-bootstrap/Container'
import Form from 'react-bootstrap/Form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { DataTable } from '../components/table/DataTable'
import { TableToolbar } from '../components/table/TableToolbar'
import { PaginationBar } from '../components/table/PaginationBar'
import { useTableState } from '../hooks/useTableState'
import { useAssistanceEvents } from '../hooks/useAssistanceEvents'
import type { AssistanceEventListItem } from '../types/assistance'

export function AssistanceLog() {
  const table = useTableState()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [program, setProgram] = useState(params.get('program') ?? 'All')
  const [from, setFrom] = useState(params.get('from') ?? '')
  const [to, setTo] = useState(params.get('to') ?? '')

  const applyFilter = (key: string, value: string, allowAll = false) => {
    const next = new URLSearchParams(params)
    if (value && !(allowAll && value === 'All')) next.set(key, value)
    else next.delete(key)
    next.set('page', '1')
    table.setPage(1)
    setParams(next)
  }

  const handleClearFilters = () => {
    setProgram('All')
    setFrom('')
    setTo('')
    const next = new URLSearchParams(params)
    next.delete('program')
    next.delete('from')
    next.delete('to')
    next.set('page', '1')
    table.setPage(1)
    setParams(next)
  }

  const { data, isLoading, error } = useAssistanceEvents(table, {
    programType: program !== 'All' ? program : undefined,
    from: from || undefined,
    to: to || undefined,
  })

  const rows = data?.items ?? []

  return (
    <Container className="py-3">
      <h1 className="h4 mb-0">Assistance Log</h1>
      <div className="text-muted small mb-3">Search by client, address, or bill type.</div>

      <TableToolbar
        search={table.search}
        onSearchChange={table.setSearch}
        onSearchClear={() => table.setSearch('')}
        placeholder="Search assistance"
      >
        <Form.Select
          size="sm"
          value={program}
          onChange={(e) => {
            setProgram(e.target.value)
            applyFilter('program', e.target.value, true)
          }}
          style={{ minWidth: 150 }}
        >
          <option value="All">All programs</option>
          <option value="FoodPantry">Food Pantry</option>
          <option value="HelpingHands">Helping Hands</option>
        </Form.Select>

        <Form.Control
          size="sm"
          type="date"
          value={from}
          onChange={(e) => {
            setFrom(e.target.value)
            applyFilter('from', e.target.value)
          }}
        />

        <Form.Control
          size="sm"
          type="date"
          value={to}
          onChange={(e) => {
            setTo(e.target.value)
            applyFilter('to', e.target.value)
          }}
        />

        <Button variant="outline-secondary" size="sm" onClick={handleClearFilters} disabled={program === 'All' && !from && !to}>
          Clear
        </Button>
        <Button size="sm" onClick={() => navigate('/assistance/new')}>
          New
        </Button>
      </TableToolbar>

      <DataTable<AssistanceEventListItem>
        columns={[
          {
            label: 'Date',
            sortKey: 'occurredAt',
            render: (row) => new Date(row.occurredAt).toLocaleDateString(),
            className: 'text-nowrap',
          },
          {
            label: 'Program',
            sortKey: 'programType',
            render: (row) => row.programType,
            className: 'text-nowrap',
          },
          {
            label: 'Address',
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
            label: 'Client',
            render: (row) => row.clientName ?? '—',
          },
          {
            label: 'Assistance',
            render: (row: AssistanceEventListItem) => {
              if (row.programType === 'FoodPantry') {
                const labels = (row.items ?? [])
                  .map((i) => i.itemType)
                  .filter((i): i is string => Boolean(i))
                  .map((i) => i.replace(/([A-Z])/g, ' $1').trim())
                if (labels.length === 0) return 'Items'
                const shown = labels.slice(0, 3).join(', ')
                return labels.length > 3 ? `Items: ${shown} +${labels.length - 3} more` : `Items: ${shown}`
              }
              // HelpingHands and others
              const parts: string[] = []
              parts.push(row.billType ?? '—')
              if (row.amountPaid != null) parts.push(`$${row.amountPaid.toFixed(2)}`)
              if (row.checkNumber) parts.push(`Check ${row.checkNumber}`)
              return parts.join(' · ')
            },
          },
        ]}
        rows={rows}
        getRowKey={(row) => row.id}
        sort={table.sort}
        onSortChange={table.setSort}
        onRowClick={(row) => {
          const appId = row.applicationId
          if (appId) {
            navigate(`/applications/${appId}#assist=${row.id}`)
          } else {
            navigate(`/assistance/${row.id}`)
          }
        }}
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