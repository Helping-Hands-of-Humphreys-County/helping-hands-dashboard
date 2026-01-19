import { useMemo, useRef, useState, Fragment } from 'react'
import type { FormEvent } from 'react'
import type { ApplicationDetails } from '../types/applications'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Container from 'react-bootstrap/Container'
import Table from 'react-bootstrap/Table'
import { DataTable } from '../components/table/DataTable'
import Alert from 'react-bootstrap/Alert'
import Spinner from 'react-bootstrap/Spinner'
import Stack from 'react-bootstrap/Stack'
import Badge from 'react-bootstrap/Badge'
import Button from 'react-bootstrap/Button'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Card from 'react-bootstrap/Card'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'
import { useNavigate, useParams } from 'react-router-dom'
import { useApplicationDetails } from '../hooks/useApplicationDetails'
import { apiPost } from '../api/http'
import type { AssistanceEventCreatePayload } from '../types/assistance'

const FOOD_PANTRY_ITEMS: { key: string; label: string }[] = [
  { key: 'FoodBox', label: 'Food box' },
  { key: 'Eggs', label: 'Eggs' },
  { key: 'Bread', label: 'Bread' },
  { key: 'Juice', label: 'Juice' },
  { key: 'Milk', label: 'Milk' },
  { key: 'Hygiene', label: 'Hygiene items' },
  { key: 'DiapersFormula', label: 'Diapers / Formula' },
]

export function ApplicationDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const hydratedForId = useRef<string | null>(null)

  const { data, isLoading, error } = useApplicationDetails(id, {
    onSuccess: (app: ApplicationDetails | undefined | null) => {
      if (!app) return
      if (hydratedForId.current === app.id) return
      hydratedForId.current = app.id

      const defaultClientId = app.applicantClientId || app.householdMembers[0]?.clientId || null
      if (defaultClientId) {
        setNoteClientId((prev) => prev ?? defaultClientId)
        setAssistClientId((prev) => prev ?? defaultClientId)
      }

      if (app.programType) {
        const nextProgram = app.programType === 'FoodPantry' ? 'FoodPantry' : app.programType
        setAssistProgram(nextProgram)
        if (nextProgram === 'FoodPantry') {
          setAssistItems((prev) => (Object.keys(prev).length ? prev : { FoodBox: true }))
        }
      }
    },
  })
  const queryClient = useQueryClient()

  const [showAssistModal, setShowAssistModal] = useState(false)
  const [noteBody, setNoteBody] = useState('')
  const [noteClientId, setNoteClientId] = useState<string | null>(null)
  const [assistProgram, setAssistProgram] = useState<string>('HelpingHands')
  const [assistOccurredAt, setAssistOccurredAt] = useState(() => new Date().toISOString().slice(0, 16))
  const [assistClientId, setAssistClientId] = useState<string | null>(null)
  const [assistBillType, setAssistBillType] = useState('')
  const [assistAmount, setAssistAmount] = useState('')
  const [assistCheckNumber, setAssistCheckNumber] = useState('')
  const [assistNotes, setAssistNotes] = useState('')
  const [assistItems, setAssistItems] = useState<Record<string, boolean>>({ FoodBox: true })
  const [assistOtherItem, setAssistOtherItem] = useState('')
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null)

  const householdClientOptions = useMemo(() => {
    if (!data) return []
    return data.householdMembers.map((m) => ({ id: m.clientId ?? '', name: m.fullName }))
  }, [data])

  const assistProgramOptions = useMemo(() => {
    if (!data) return []
    const programs = new Set<string>(['HelpingHands', 'FoodPantry'])
    if (data.programType) programs.add(data.programType)
    return Array.from(programs)
  }, [data])

  const foodItemsSelected = useMemo(
    () => Object.entries(assistItems).filter(([, checked]) => checked).map(([key]) => key),
    [assistItems]
  )

  const addNote = useMutation({
    mutationFn: async ({ clientId, body }: { clientId: string; body: string }) => {
      const trimmed = body.trim()
      if (!trimmed) throw new Error('Note cannot be empty')
      return apiPost<string>(`/clients/${clientId}/notes`, { body: trimmed })
    },
    onSuccess: async (_, variables) => {
      setNoteBody('')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['applications', id] }),
        queryClient.invalidateQueries({ queryKey: ['clients', variables.clientId] }),
      ])
    },
  })

  const addAssistance = useMutation({
    mutationFn: async (payload: AssistanceEventCreatePayload) => apiPost<string>('/assistance-events', payload),
    onSuccess: async () => {
      setAssistAmount('')
      setAssistBillType('')
      setAssistNotes('')
      setAssistCheckNumber('')
      setAssistItems(assistProgram === 'FoodPantry' ? { FoodBox: true } : {})
      setAssistOtherItem('')
      setShowAssistModal(false)
      await queryClient.invalidateQueries({ queryKey: ['applications', id] })
    },
  })

  const handleAddNote = (e: FormEvent) => {
    e.preventDefault()
    if (!data) return
    const targetId = noteClientId || data.applicantClientId
    if (!targetId) return
    addNote.mutate({ clientId: targetId, body: noteBody })
  }

  const handleAddAssistance = (e: FormEvent) => {
    e.preventDefault()
    if (!data) return
    const pantryItems = assistProgram === 'FoodPantry'
      ? (foodItemsSelected.length > 0 ? foodItemsSelected : ['FoodBox'])
      : []
    const otherItem = assistProgram === 'FoodPantry' ? assistOtherItem.trim() : ''

    const payload: AssistanceEventCreatePayload = {
      programType: assistProgram,
      occurredAt: assistOccurredAt ? new Date(assistOccurredAt).toISOString() : new Date().toISOString(),
      householdId: data.householdId,
      householdMemberCount: data.householdMembers.length,
      clientId: (assistClientId || data.applicantClientId) ?? null,
      applicationId: data.id,
      billType: assistBillType || null,
      amountPaid: assistAmount ? Number(assistAmount) : null,
      checkNumber: assistCheckNumber || null,
      notes: assistNotes || null,
      items: [
        ...pantryItems.map((itemType) => ({ itemType, quantity: 1 })),
        ...(otherItem ? [{ itemType: `Other: ${otherItem}`, quantity: 1 }] : []),
      ],
    }

    addAssistance.mutate(payload)
  }

  if (isLoading) {
    return (
      <Container className="py-3">
        <Spinner animation="border" role="status" size="sm" />
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="py-3">
        <Alert variant="danger">Unable to load application.</Alert>
      </Container>
    )
  }

  if (!data) {
    return (
      <Container className="py-3">
        <Alert variant="warning">Not found.</Alert>
      </Container>
    )
  }

  const applicant = data.householdMembers.find((m) => m.clientId === data.applicantClientId)
  const applicantName = applicant?.fullName ?? 'Applicant'

  const selectedClientId = noteClientId || data.applicantClientId
  const assistSelectedClientId = assistClientId || data.applicantClientId

  const lastFoodBox = data.householdAssistance.find((a) =>
    a.programType === 'FoodPantry' && (a.items?.some((i) => i.itemType?.toLowerCase() === 'foodbox' || i.itemType?.toLowerCase() === 'food box') ?? false)
  )

  // Summary counts for reporting: distinct households helped and clients helped
  const assistanceHouseholds = Array.from(new Set(data.householdAssistance.map((a) => a.householdId)))
  const householdsHelped = assistanceHouseholds.length
  const clientsHelped = assistanceHouseholds.reduce((sum, hid) => {
    // find max reported householdMemberCount for this household across events
    const counts = data.householdAssistance
      .filter((a) => a.householdId === hid)
      .map((a) => a.householdMemberCount).filter((n): n is number => typeof n === 'number')
    if (counts.length) return sum + Math.max(...counts)
    // fallback to current household size for this application
    return sum + data.householdMembers.length
  }, 0)

  const renderItems = (items?: { itemType?: string | null; quantity: number }[] | null) => {
    if (!items || items.length === 0) return null
    const labels = items
      .map((i) => i.itemType)
      .filter((i): i is string => Boolean(i))
      .map((i) => i.replace(/([A-Z])/g, ' $1').trim())
    return labels.length ? labels.join(', ') : null
  }

  const renderAssistanceSummary = (a: {
    programType: string
    billType?: string | null
    amountPaid?: number | null
    checkNumber?: string | null
    items?: { itemType?: string | null }[] | null
  }) => {
    if (a.programType === 'FoodPantry') {
      const itemsLabel = renderItems(a.items) || 'Items'
      return <div>Items: {itemsLabel}</div>
    }
    // HelpingHands and others
    return (
      <div>
        {a.billType ?? '—'}{a.amountPaid != null ? ` · $${a.amountPaid.toLocaleString()}` : ''}{a.checkNumber ? ` · Check ${a.checkNumber}` : ''}
      </div>
    )
  }

  const renderAssistanceMetaChips = (a: { notes?: string | null; checkNumber?: string | null; householdMemberCount?: number; recordedByUserDisplayName?: string | null }) => (
    <div className="d-flex gap-2 flex-wrap">
      {a.notes ? <Badge bg="info">Has notes</Badge> : null}
      {a.checkNumber ? <Badge bg="secondary">#{a.checkNumber}</Badge> : null}
      {a.householdMemberCount ? <Badge bg="light" text="dark">👥 {a.householdMemberCount}</Badge> : null}
      {a.recordedByUserDisplayName ? <div className="text-muted small">Verified by {a.recordedByUserDisplayName}</div> : null}
    </div>
  )

  const renderAssistanceDetailsExpanded = (a: any) => (
    <div className="p-2">
      <div className="mb-2">
        <strong>Summary:</strong> {renderAssistanceSummary(a)}
      </div>
      <div className="mb-2">
        {a.programType === 'FoodPantry' ? (
          <div>
            {renderItems(a.items) ? <div className="small">Items: {renderItems(a.items)}</div> : null}
          </div>
        ) : (
          <div>
            {a.billType ? <div className="small">Bill type: {a.billType}</div> : null}
            {a.amountPaid != null ? <div className="small">Amount: ${a.amountPaid.toLocaleString()}</div> : null}
            {a.checkNumber ? <div className="small">Check #: {a.checkNumber}</div> : null}
          </div>
        )}
      </div>
      {a.notes ? <div className="mb-2">Notes: <div className="small text-muted">{a.notes}</div></div> : null}
      <div className="d-flex gap-2">
        <Button variant="danger" size="sm" onClick={() => {/* TODO: implement delete with confirm modal */}}>Delete</Button>
        {renderAssistanceMetaChips(a)}
      </div>
    </div>
  )

  return (
    <Container className="py-3">
      <Stack direction="horizontal" gap={2} className="mb-3 flex-wrap align-items-center">
        <div className="fw-semibold fs-5 mb-0">{applicantName}</div>
        <Badge bg="secondary">{data.programType}</Badge>
        {data.status ? <Badge bg="info" text="dark">{data.status}</Badge> : null}
      </Stack>

      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
        <div className="fw-semibold mb-0">Assistance linked to this application</div>
        <Button size="sm" onClick={() => setShowAssistModal(true)}>Add assistance</Button>
      </div>

      <div className="mb-3 small text-muted">
        Households helped: {householdsHelped} · Clients helped: {clientsHelped}
      </div>

      {(data.programType === 'FoodPantry' || data.programType === 'Both') ? (
        <Card className="mb-3">
          <Card.Body>
            <Card.Title className="h6">Food stamps</Card.Title>
            <Row className="g-3">
              <Col md={4}>
                <div className="text-muted small">Receives food stamps</div>
                <div>{data.receivesFoodStamps === true ? 'Yes' : data.receivesFoodStamps === false ? 'No' : 'Unknown'}</div>
              </Col>
              <Col md={4}>
                <div className="text-muted small">Amount</div>
                <div>{data.foodStampsAmount != null ? `$${data.foodStampsAmount.toLocaleString()}` : '—'}</div>
              </Col>
              <Col md={4}>
                <div className="text-muted small">Date available</div>
                <div>{data.foodStampsDateAvailable ? new Date(data.foodStampsDateAvailable).toLocaleDateString() : '—'}</div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      ) : null}

      <div className="mb-4">
        {data.assistance.length === 0 ? (
          <Alert variant="info">No assistance recorded for this application yet.</Alert>
        ) : (
          <DataTable
            columns={[
              {
                label: 'Date',
                sortKey: 'occurredAt',
                render: (row: any) => new Date(row.occurredAt).toLocaleDateString(),
                className: 'text-nowrap',
              },
              {
                label: 'Program',
                sortKey: 'programType',
                render: (row: any) => row.programType,
                className: 'text-nowrap',
              },
              {
                label: 'Bill/Item',
                render: (row: any) => renderAssistanceSummary(row),
              },
              {
                label: 'Amount / Details',
                render: (row: any) => (
                  <div>
                    {row.clientName ?? '—'}
                    <div className="mt-1">{renderAssistanceMetaChips(row)}</div>
                  </div>
                ),
              },
            ]}
            rows={data.assistance}
            getRowKey={(r: any) => r.id}
            onRowClick={(r: any) => setExpandedEventId((prev) => (prev === r.id ? null : r.id))}
            expandedRowId={expandedEventId}
            renderExpandedRow={(r: any) => renderAssistanceDetailsExpanded(r)}
          />
        )}
      </div>

      <div className="mt-4">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
          <div className="fw-semibold mb-0">Household assistance (all members)</div>
        </div>
        {data.householdAssistance.length === 0 ? (
          <Alert variant="info">No assistance recorded for this household yet.</Alert>
        ) : (
          <DataTable
            columns={[
              {
                label: 'Date',
                sortKey: 'occurredAt',
                render: (row: any) => new Date(row.occurredAt).toLocaleDateString(),
                className: 'text-nowrap',
              },
              {
                label: 'Program',
                sortKey: 'programType',
                render: (row: any) => row.programType,
                className: 'text-nowrap',
              },
              {
                label: 'Person',
                render: (row: any) => row.clientName ?? 'Household',
              },
              {
                label: 'Bill/Item',
                render: (row: any) => renderAssistanceSummary(row),
              },
              {
                label: 'Amount / Details',
                render: (row: any) => renderAssistanceMetaChips(row),
              },
            ]}
            rows={data.householdAssistance}
            getRowKey={(r: any) => r.id}
            onRowClick={(r: any) => setExpandedEventId((prev) => (prev === r.id ? null : r.id))}
            expandedRowId={expandedEventId}
            renderExpandedRow={(r: any) => renderAssistanceDetailsExpanded(r)}
          />
        )}
      </div>

      <div className="mt-4">
        <div className="fw-semibold mb-2">Household members</div>
          <Table bordered striped size="sm" responsive>
          <thead>
            <tr>
              <th>Name</th>
              <th>Relationship</th>
              <th>Income</th>
            </tr>
          </thead>
          <tbody>
            {data.householdMembers.map((m) => (
              <tr key={m.id}>
                <td>{m.fullName}</td>
                <td>{m.relationshipToApplicant ?? '—'}</td>
                <td>
                  {m.incomeAmount != null ? `$${m.incomeAmount.toLocaleString()}` : '—'}{' '}
                  {m.incomeSource ? `(${m.incomeSource})` : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        {/* Total household income (sum of reported incomes) */}
        <div className="mt-3">
          {(() => {
            const total = data.householdMembers.reduce((s, m) => s + (m.incomeAmount ?? 0), 0)
            const any = data.householdMembers.some((m) => typeof m.incomeAmount === 'number' && m.incomeAmount > 0)
            return (
              <div className="p-2 border rounded bg-light d-inline-block">
                <div className="small text-muted">Total household income</div>
                <div className="fw-semibold fs-5">{any ? `$${total.toLocaleString()}` : '—'}</div>
              </div>
            )
          })()}
        </div>
      </div>

      <div className="mt-4">
        <Stack direction="horizontal" gap={2} className="mb-2 flex-wrap">
          <div className="fw-semibold mb-0">Household notes</div>
        </Stack>

        <Form onSubmit={handleAddNote} className="mb-3">
          <Stack gap={2}>
            <Form.Group controlId="noteClient" className="w-50">
              <Form.Label className="small text-muted">Person</Form.Label>
              <Form.Select
                value={selectedClientId}
                onChange={(e) => setNoteClientId(e.target.value)}
              >
                {householdClientOptions.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group controlId="noteBody">
              <Form.Label className="small text-muted">Add a note</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                style={{ resize: 'none' }}
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                placeholder="Context, updates, or outcomes"
              />
            </Form.Group>

            <div className="d-flex justify-content-end">
              <Button type="submit" size="sm" disabled={addNote.isPending || !noteBody.trim()}>
                {addNote.isPending ? 'Adding...' : 'Add note'}
              </Button>
            </div>
          </Stack>
        </Form>

        {data.householdNotes.length === 0 ? (
          <Alert variant="light" className="text-muted">No notes yet for this household.</Alert>
        ) : (
          <Stack gap={2}>
            {data.householdNotes.map((note) => {
              const created = new Date(note.createdAt).toLocaleString()
              const edited = note.editedAt ? new Date(note.editedAt).toLocaleString() : null
              return (
                <Card key={note.id} className="border">
                  <Card.Body className="py-2">
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <div className="flex-grow-1">
                        <div className="fw-semibold small mb-1">{note.clientName}</div>
                        <div className="small">{note.body}</div>
                      </div>
                      <div className="text-muted small text-end">
                        <div>{note.authorDisplayName}</div>
                        <div>{created}</div>
                        {edited ? <div>Edited {edited}</div> : null}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              )
            })}
          </Stack>
        )}
      </div>

      <Modal show={showAssistModal} onHide={() => setShowAssistModal(false)} size="lg">
        <Form onSubmit={handleAddAssistance}>
          <Modal.Header closeButton>
            <Modal.Title>Add assistance</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row className="g-2">
              <Col md={4}>
                <Form.Group controlId="assistProgram">
                  <Form.Label className="small text-muted">Program</Form.Label>
                  <Form.Select
                    value={assistProgram}
                    onChange={(e) => {
                      const next = e.target.value
                      setAssistProgram(next)
                      if (next === 'FoodPantry') {
                        setAssistItems((prev) => ({ FoodBox: true, ...prev }))
                        setAssistOtherItem('')
                      } else {
                        setAssistItems({})
                        setAssistOtherItem('')
                      }
                    }}
                    disabled={assistProgramOptions.length === 1}
                  >
                    {assistProgramOptions.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={8}>
                <Form.Group controlId="assistOccurredAt">
                  <Form.Label className="small text-muted">Date & time</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    value={assistOccurredAt}
                    onChange={(e) => setAssistOccurredAt(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-2 mt-2 align-items-end">
              <Col md={6}>
                <Form.Group controlId="assistClient">
                  <Form.Label className="small text-muted">Person</Form.Label>
                  <Form.Select
                    value={assistSelectedClientId}
                    onChange={(e) => setAssistClientId(e.target.value)}
                  >
                    {householdClientOptions.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="assistBillType">
                  <Form.Label className="small text-muted">{assistProgram === 'FoodPantry' ? 'Pantry note / category' : 'Bill type'}</Form.Label>
                  <Form.Control
                    value={assistBillType}
                    onChange={(e) => setAssistBillType(e.target.value)}
                    placeholder={assistProgram === 'FoodPantry' ? 'Optional pantry note' : 'Rent / bill type'}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-2 mt-2 align-items-end">
              <Col md={6}>
                <Form.Group controlId="assistAmount">
                  <Form.Label className="small text-muted">Amount</Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    value={assistAmount}
                    onChange={(e) => setAssistAmount(e.target.value)}
                    placeholder="Optional"
                    disabled={assistProgram === 'FoodPantry'}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="assistCheck">
                  <Form.Label className="small text-muted">Check #</Form.Label>
                  <Form.Control
                    value={assistCheckNumber}
                    onChange={(e) => setAssistCheckNumber(e.target.value)}
                    placeholder="Optional"
                    disabled={assistProgram === 'FoodPantry'}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-2 mt-2 align-items-end">
              <Col>
                <Form.Group controlId="assistNotes">
                  <Form.Label className="small text-muted">Notes</Form.Label>
                  <Form.Control
                    value={assistNotes}
                    onChange={(e) => setAssistNotes(e.target.value)}
                    placeholder="Optional context"
                  />
                </Form.Group>
              </Col>
            </Row>

            {assistProgram === 'FoodPantry' ? (
              <Row className="g-2 mt-3">
                <Col>
                  <div className="small text-muted mb-1">Dispensed items (office use)</div>
                  <Stack direction="horizontal" gap={2} className="flex-wrap">
                    {FOOD_PANTRY_ITEMS.map((item) => {
                      const checked = assistItems[item.key] ?? false
                      return (
                        <Form.Check
                          key={item.key}
                          id={`item-${item.key}`}
                          type="checkbox"
                          label={item.label}
                          checked={checked}
                          onChange={(evt) =>
                            setAssistItems((prev) => ({
                              ...prev,
                              [item.key]: evt.target.checked,
                            }))
                          }
                        />
                      )
                    })}
                  </Stack>
                  <Form.Group controlId="assistOther" className="mt-2">
                    <Form.Label className="small text-muted">Other (specify)</Form.Label>
                    <Form.Control
                      value={assistOtherItem}
                      onChange={(e) => setAssistOtherItem(e.target.value)}
                      placeholder="e.g., Fresh produce"
                    />
                  </Form.Group>
                </Col>
              </Row>
            ) : null}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAssistModal(false)} disabled={addAssistance.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={addAssistance.isPending}>
              {addAssistance.isPending ? 'Recording...' : 'Submit'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  )
}

