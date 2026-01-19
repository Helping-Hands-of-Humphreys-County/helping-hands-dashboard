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
import { useApplicationsList } from '../hooks/useApplicationsList'
import type { ApplicationListItem } from '../types/applications'

export function ApplicationsList() {
  const table = useTableState()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [program, setProgram] = useState(params.get('program') ?? 'All')
  const [status, setStatus] = useState(params.get('status') ?? 'All')
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
    setStatus('All')
    setFrom('')
    setTo('')
    const next = new URLSearchParams(params)
    next.delete('program')
    next.delete('status')
    next.delete('from')
    next.delete('to')
    next.set('page', '1')
    table.setPage(1)
    setParams(next)
  }

  const { data, isLoading, error } = useApplicationsList(table, {
    programType: program !== 'All' ? program : undefined,
    status: status !== 'All' ? status : undefined,
    from: from || undefined,
    to: to || undefined,
  })

  const rows = data?.items ?? []

  return (
    <Container className="py-3">
      <h1 className="h4 mb-0">Applications</h1>
      <div className="text-muted small mb-3">Track household applications and their statuses.</div>

      <TableToolbar
        search={table.search}
        onSearchChange={table.setSearch}
        onSearchClear={() => table.setSearch('')}
        placeholder="Search applications"
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

        <Form.Select
          size="sm"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            applyFilter('status', e.target.value, true)
          }}
          style={{ minWidth: 140 }}
        >
          <option value="All">All statuses</option>
          <option value="Submitted">Submitted</option>
          <option value="InReview">In review</option>
          <option value="Approved">Approved</option>
          <option value="Denied">Denied</option>
          <option value="Withdrawn">Withdrawn</option>
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

        <Button variant="outline-secondary" size="sm" onClick={handleClearFilters} disabled={
          program === 'All' && status === 'All' && !from && !to
        }>
          Clear
        </Button>
        <Button size="sm" onClick={() => navigate('/applications/new')}>
          New
        </Button>
      </TableToolbar>

      <DataTable<ApplicationListItem>
        columns={[
          {
            label: 'Submitted',
            sortKey: 'submittedAt',
            render: (row) => {
              if (!row.submittedAt) return '—'
              const d = new Date(row.submittedAt)
              const datePart = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
              const weekday = d.toLocaleDateString(undefined, { weekday: 'long' })
              const timePart = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
              return (
                <div>
                  <div>{datePart}</div>
                  <div className="text-muted">{weekday}, {timePart}</div>
                </div>
              )
            },
            className: 'text-nowrap',
          },
          {
            label: 'Program',
            sortKey: 'programType',
            render: (row) => row.programType,
            className: 'text-nowrap',
          },
          {
            label: 'Applicant',
            sortKey: 'applicantName',
            render: (row) => row.applicantName,
            className: 'text-nowrap',
          },
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
            label: 'Status',
            sortKey: 'status',
            render: (row) => <Badge bg={row.status === "Approved" ? "success" : "secondary"}>{row.status}</Badge>,
            className: 'text-nowrap',
          },
        ]}
        rows={rows}
        getRowKey={(row) => row.id}
        sort={table.sort}
        onSortChange={table.setSort}
        onRowClick={(row) => navigate(`/applications/${row.id}`)}
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