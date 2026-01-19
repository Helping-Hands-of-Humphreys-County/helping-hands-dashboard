import type { FormEvent } from 'react'
import { useState } from 'react'
import Container from 'react-bootstrap/Container'
import Table from 'react-bootstrap/Table'
import { DataTable } from '../components/table/DataTable'
import Alert from 'react-bootstrap/Alert'
import Spinner from 'react-bootstrap/Spinner'
import Stack from 'react-bootstrap/Stack'
import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import Form from 'react-bootstrap/Form'
import { useNavigate, useParams } from 'react-router-dom'
import { useClientDetails } from '../hooks/useClientDetails'
import { useClientNoteMutations } from '../hooks/useClientNoteMutations'
import { useAuth } from '../auth/AuthContext'

export function ClientDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data, isLoading, error } = useClientDetails(id)
  const { create, update, remove } = useClientNoteMutations(id)

  const [newNoteBody, setNewNoteBody] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingBody, setEditingBody] = useState('')

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
        <Alert variant="danger">Unable to load client.</Alert>
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

  const handleCreateNote = (e: FormEvent) => {
    e.preventDefault()
    const body = newNoteBody.trim()
    if (!body) return
    create.mutate(
      { body },
      {
        onSuccess: () => setNewNoteBody(''),
      },
    )
  }

  const startEdit = (noteId: string, body: string) => {
    setEditingId(noteId)
    setEditingBody(body)
  }

  const handleUpdateNote = (e: FormEvent) => {
    e.preventDefault()
    if (!editingId) return
    const body = editingBody.trim()
    if (!body) return
    update.mutate(
      { noteId: editingId, payload: { body } },
      {
        onSuccess: () => {
          setEditingId(null)
          setEditingBody('')
        },
      },
    )
  }

  return (
    <Container className="py-3">
      <Stack direction="horizontal" className="mb-3" gap={3}>
        <h1 className="h4 mb-0">
          {data.firstName} {data.lastName}
        </h1>
        <Button variant="outline-primary" size="sm" className="ms-auto" onClick={() => navigate(`/clients/${id}/edit`)}>
          Edit
        </Button>
      </Stack>

      <Stack gap={3} className="mb-4">
        <div>
          <div className="fw-semibold">Current household</div>
          <div className="text-muted small">
            {data.household ? `${data.household.street1}, ${data.household.city} ${data.household.state}` : 'None'}
          </div>
        </div>

        <div>
          <div className="fw-semibold mb-2">Household members</div>
          {data.householdMembers.length === 0 ? (
            <Alert variant="info">No household members on file.</Alert>
          ) : (
            <Table bordered striped size="sm" responsive>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                </tr>
              </thead>
              <tbody>
                {data.householdMembers.map((m) => (
                  <tr key={m.id}>
                    <td>
                      {m.firstName} {m.lastName}
                    </td>
                    <td>{m.phone ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>
      </Stack>

      <Card>
        <Card.Body>
          <Card.Title className="h6">Notes</Card.Title>

          <Form onSubmit={editingId ? handleUpdateNote : handleCreateNote} className="mb-3">
            <Form.Group controlId="noteBody">
              <Form.Label className="small text-muted">
                {editingId ? 'Edit note' : 'Add a note'}
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={editingId ? editingBody : newNoteBody}
                onChange={(e) => (editingId ? setEditingBody(e.target.value) : setNewNoteBody(e.target.value))}
                placeholder="Add context, updates, or outcomes."
              />
            </Form.Group>
            <Stack direction="horizontal" gap={2} className="mt-2 flex-wrap">
              <Button
                type="submit"
                size="sm"
                disabled={editingId ? update.isPending : create.isPending}
              >
                {editingId ? (update.isPending ? 'Saving…' : 'Save changes') : create.isPending ? 'Adding…' : 'Add note'}
              </Button>
              {editingId ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => {
                    setEditingId(null)
                    setEditingBody('')
                  }}
                  disabled={update.isPending}
                >
                  Cancel
                </Button>
              ) : null}
            </Stack>
          </Form>

          {data.notes.length === 0 ? (
            <div className="text-muted small">No notes yet.</div>
          ) : (
            <Stack gap={2}>
              {data.notes.map((note) => {
                const isAuthor = note.authorUserId === user?.id
                const created = new Date(note.createdAt).toLocaleString()
                const edited = note.editedAt ? new Date(note.editedAt).toLocaleString() : null
                const authorLabel = isAuthor ? 'You' : note.authorDisplayName || 'Unknown user'
                const authorEmail = !isAuthor && note.authorEmail ? ` · ${note.authorEmail}` : ''

                return (
                  <Card key={note.id} className="border">
                    <Card.Body className="py-2">
                      <div className="d-flex align-items-start justify-content-between gap-2">
                        <div className="flex-grow-1">
                          <div className="text-muted small mb-1">
                            {authorLabel}
                            {authorEmail}
                            {` · ${created}`}
                            {edited ? ` · Edited ${edited}` : ''}
                          </div>
                          <div style={{ whiteSpace: 'pre-wrap' }}>{note.body}</div>
                        </div>
                        {isAuthor ? (
                          <Stack direction="horizontal" gap={1} className="flex-shrink-0">
                            <Button
                              size="sm"
                              variant="outline-secondary"
                              onClick={() => startEdit(note.id, note.body)}
                              disabled={update.isPending}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => remove.mutate({ noteId: note.id })}
                              disabled={remove.isPending}
                            >
                              Delete
                            </Button>
                          </Stack>
                        ) : null}
                      </div>
                    </Card.Body>
                  </Card>
                )
              })}
            </Stack>
          )}
        </Card.Body>
      </Card>

      <Card className="mt-3">
        <Card.Body>
          <Card.Title className="h6">Household notes (all members)</Card.Title>
          {data.householdNotes.length === 0 ? (
            <div className="text-muted small">No household notes yet.</div>
          ) : (
            <Stack gap={2}>
              {data.householdNotes.map((note) => {
                const created = new Date(note.createdAt).toLocaleString()
                const edited = note.editedAt ? new Date(note.editedAt).toLocaleString() : null
                return (
                  <Card key={note.id} className="border">
                    <Card.Body className="py-2">
                      <div className="text-muted small mb-1">
                        Note by: <strong>{note.authorDisplayName}</strong>
                        {note.authorEmail ? ` (${note.authorEmail})` : ''} for <strong>{note.clientName}</strong> at <strong>{created}</strong>
                        {edited ? ` · Edited ${edited}` : ''}
                      </div>
                      <div style={{ whiteSpace: 'pre-wrap' }}>{note.body}</div>
                    </Card.Body>
                  </Card>
                )
              })}
            </Stack>
          )}
        </Card.Body>
      </Card>

      <Card className="mt-3">
        <Card.Body>
          <Card.Title className="h6">Household assistance (all members)</Card.Title>
          {data.householdAssistance.length === 0 ? (
            <div className="text-muted small">No household assistance recorded.</div>
          ) : (
            <DataTable
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
                  label: 'Person',
                  render: (row) => row.clientName ?? 'Household',
                },
                {
                  label: 'Bill/Item',
                  render: (row) => {
                    if (row.programType === 'FoodPantry') {
                      const labels = (row.items ?? [])
                        .map((i) => i.itemType)
                        .filter((i) => Boolean(i))
                        .map((i) => i.replace(/([A-Z])/g, ' $1').trim())
                      return labels.length ? labels.join(', ') : 'Items'
                    }
                    return row.billType ?? '—'
                  },
                },
                {
                  label: 'Amount/Notes',
                  render: (row) => (
                    <div>
                      <div>{row.amountPaid != null ? `$${row.amountPaid.toLocaleString()}` : '—'}</div>
                      {row.notes ? <div className="text-muted small">{row.notes}</div> : null}
                    </div>
                  ),
                },
              ]}
              rows={data.householdAssistance}
              getRowKey={(r) => r.id}
              onRowClick={(r) => {
                const appId = r.applicationId
                if (appId) {
                  navigate(`/applications/${appId}#assist=${r.id}`)
                } else {
                  navigate(`/assistance/${r.id}`)
                }
              }}
            />
          )}
        </Card.Body>
      </Card>
    </Container>
  )
}
