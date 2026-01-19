import type { FormEvent } from 'react'
import { useRef, useState } from 'react'
import Alert from 'react-bootstrap/Alert'
import Button from 'react-bootstrap/Button'
import Container from 'react-bootstrap/Container'
import Form from 'react-bootstrap/Form'
import Spinner from 'react-bootstrap/Spinner'
import Stack from 'react-bootstrap/Stack'
import { useNavigate, useParams } from 'react-router-dom'
import { useHouseholdDetails } from '../hooks/useHouseholdDetails'
import type { HouseholdDetails } from '../types/households'
import { useHouseholdMutations } from '../hooks/useHouseholdMutations'
import ListGroup from 'react-bootstrap/ListGroup'
import InputGroup from 'react-bootstrap/InputGroup'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost } from '../api/http'
import type { ClientListResponse, ClientListItem } from '../types/clients'

export function HouseholdForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const hydratedForId = useRef<string | null>(null)

  const [members, setMembers] = useState<ClientListItem[]>([])
  const [clientSearch, setClientSearch] = useState('')
  const [clientResults, setClientResults] = useState<ClientListItem[]>([])

  const { isLoading, error } = useHouseholdDetails(id, {
    onSuccess: (household: HouseholdDetails | undefined | null) => {
      if (!household) return
      if (hydratedForId.current === household.id) return
      hydratedForId.current = household.id

      setStreet1(household.street1)
      setStreet2(household.street2 ?? '')
      setCity(household.city)
      setState(household.state)
      setZip(household.zip ?? '')
      // populate members local state for editing
      setMembers(household.members.map((m) => ({ id: m.id, firstName: m.firstName, lastName: m.lastName, dob: m.dob ?? undefined, phone: m.phone ?? undefined })))
    },
    onError: () => {
      hydratedForId.current = null
    },
  })
  const { create, update } = useHouseholdMutations()
  const qc = useQueryClient()

  const addMemberMutation = useMutation({
    mutationFn: (clientId: string) => apiPost<void>(`/households/${id}/add-member`, { clientId }),
    onSuccess: async (_, clientId) => {
      qc.invalidateQueries({ queryKey: ['households'] })
      qc.invalidateQueries({ queryKey: ['households', 'details', id] })
      // append client to local members if present in results
      const found = clientResults.find((c) => c.id === clientId)
      if (found) setMembers((m) => [...m, found])
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: (clientId: string) => apiPost<void>(`/households/${id}/remove-member`, { clientId }),
    onSuccess: async (_, clientId) => {
      qc.invalidateQueries({ queryKey: ['households'] })
      qc.invalidateQueries({ queryKey: ['households', 'details', id] })
      setMembers((m) => m.filter((x) => x.id !== clientId))
    },
  })

  const [street1, setStreet1] = useState('')
  const [street2, setStreet2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('TN')
  const [zip, setZip] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    const payload = {
      street1: street1.trim(),
      street2: street2 || null,
      city: city.trim(),
      state: state.trim() || 'TN',
      zip: zip || null,
    }

    if (isEdit && id) {
      update.mutate(
        { id, payload },
        {
          onSuccess: () => navigate('/households'),
        },
      )
    } else {
      create.mutate(payload, {
        onSuccess: () => navigate('/households'),
      })
    }
  }

  if (isEdit && isLoading) {
    return (
      <Container className="py-3">
        <Spinner animation="border" size="sm" />
      </Container>
    )
  }

  if (isEdit && error) {
    return (
      <Container className="py-3">
        <Alert variant="danger">Unable to load household.</Alert>
      </Container>
    )
  }

  const saving = create.isPending || update.isPending
  const submitError = create.error || update.error

  return (
    <Container className="py-3" style={{ maxWidth: 720 }}>
      <h1 className="h4 mb-3">{isEdit ? 'Edit Household' : 'Add Household'}</h1>

      {submitError ? <Alert variant="danger">Unable to save household. Try again.</Alert> : null}

      <Form onSubmit={handleSubmit} className="bg-white p-3 border rounded">
        <Stack gap={3}>
          <Form.Group controlId="street1">
            <Form.Label>Street address</Form.Label>
            <Form.Control
              value={street1}
              onChange={(e) => setStreet1(e.target.value)}
              required
              placeholder="123 Main St"
            />
          </Form.Group>

          <Form.Group controlId="street2">
            <Form.Label>Address line 2</Form.Label>
            <Form.Control
              value={street2}
              onChange={(e) => setStreet2(e.target.value)}
              placeholder="Apartment, unit, etc."
            />
          </Form.Group>

          <div className="d-flex gap-2 flex-wrap">
            <Form.Group className="flex-grow-1" controlId="city">
              <Form.Label>City</Form.Label>
              <Form.Control value={city} onChange={(e) => setCity(e.target.value)} required />
            </Form.Group>

            <Form.Group style={{ minWidth: 120 }} controlId="state">
              <Form.Label>State</Form.Label>
              <Form.Control value={state} onChange={(e) => setState(e.target.value)} required />
            </Form.Group>

            <Form.Group style={{ minWidth: 120 }} controlId="zip">
              <Form.Label>ZIP</Form.Label>
              <Form.Control value={zip} onChange={(e) => setZip(e.target.value)} />
            </Form.Group>
          </div>

          <div>
            <div className="mb-3">
              <div className="fw-semibold mb-2">Members</div>
              {members.length === 0 ? (
                <div className="text-muted">No members</div>
              ) : (
                <ListGroup>
                  {members.map((m) => (
                    <ListGroup.Item key={m.id} className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="fw-semibold">{m.firstName} {m.lastName}</div>
                        <div className="text-muted small">{m.dob ?? 'DOB unknown'}{m.phone ? ` · ${m.phone}` : ''}</div>
                      </div>
                      <div>
                        <Button size="sm" variant="outline-danger" onClick={() => removeMemberMutation.mutate(m.id)}>Remove</Button>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}

              {isEdit && (
                <div className="mt-3">
                  <div className="small text-muted mb-1">Add existing client to this household</div>
                  <InputGroup>
                    <Form.Control
                      placeholder="Search clients by name"
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                    />
                    <Button onClick={async () => {
                      if (!clientSearch || !id) return
                      try {
                        const resp = await apiGet<ClientListResponse>(`/clients?search=${encodeURIComponent(clientSearch)}&pageSize=10`)
                        setClientResults(resp.items)
                      } catch {
                        setClientResults([])
                      }
                    }}>Search</Button>
                  </InputGroup>
                  {clientResults.length > 0 && (
                    <ListGroup className="mt-2">
                      {clientResults.map((c) => (
                        <ListGroup.Item key={c.id} className="d-flex justify-content-between align-items-center">
                          <div>{c.firstName} {c.lastName} <div className="small text-muted">{c.city ? `${c.city}, ${c.state}` : ''}</div></div>
                          <Button size="sm" onClick={() => addMemberMutation.mutate(c.id)}>Add</Button>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="d-flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Update Household' : 'Create Household'}
            </Button>
            <Button variant="outline-secondary" type="button" onClick={() => navigate('/households')}>
              Cancel
            </Button>
          </div>
        </Stack>
      </Form>
    </Container>
  )
}