import type { FormEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { PhoneInput } from '../components/PhoneInput'
import { useQuery } from '@tanstack/react-query'
import Alert from 'react-bootstrap/Alert'
import Button from 'react-bootstrap/Button'
import Container from 'react-bootstrap/Container'
import Form from 'react-bootstrap/Form'
import Spinner from 'react-bootstrap/Spinner'
import Stack from 'react-bootstrap/Stack'
import { useNavigate, useParams } from 'react-router-dom'
import { HouseholdSelectModal } from '../components/modals/HouseholdSelectModal'
import { CreateHouseholdModal } from '../components/modals/CreateHouseholdModal'
import { apiGet } from '../api/http'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useClientDetails } from '../hooks/useClientDetails'
import { useClientMutations } from '../hooks/useClientMutations'
import { useHouseholdMutations } from '../hooks/useHouseholdMutations'
import type { HouseholdListItem, HouseholdListResponse } from '../types/households'

type HouseholdChoice = {
  id: string
  street1: string
  street2?: string | null
  city: string
  state: string
  zip?: string | null
  memberCount?: number | null
}

export function ClientForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const hydratedForId = useRef<string | null>(null)

  const { data, isLoading, error } = useClientDetails(id)

  useEffect(() => {
    const client = data
    if (!client) return
    if (hydratedForId.current === client.id) return
    hydratedForId.current = client.id

    setFirstName((prev) => (prev === client.firstName ? prev : client.firstName))
    setLastName((prev) => (prev === client.lastName ? prev : client.lastName))
    setDob((prev) => (prev === (client.dob ? client.dob.slice(0, 10) : '') ? prev : (client.dob ? client.dob.slice(0, 10) : '')))
    setPhone((prev) => (prev === (client.phone ?? '') ? prev : (client.phone ?? '')))

    setHousehold((prev) => {
      const next = client.household
        ? {
            id: client.household.id,
            street1: client.household.street1,
            street2: client.household.street2 ?? null,
            city: client.household.city,
            state: client.household.state,
            zip: client.household.zip ?? null,
            memberCount: client.householdMembers ? client.householdMembers.length : null,
          }
        : null

      // shallow compare to avoid unnecessary state updates
      if (!prev && !next) return prev
      if (!prev || !next) return next
      if (
        prev.id === next.id &&
        prev.street1 === next.street1 &&
        prev.street2 === next.street2 &&
        prev.city === next.city &&
        prev.state === next.state &&
        prev.zip === next.zip &&
        prev.memberCount === next.memberCount
      ) {
        return prev
      }
      return next
    })
  }, [data?.id])

  useEffect(() => {
    hydratedForId.current = null
  }, [id])
  const { create, update } = useClientMutations()
  const { create: createHousehold } = useHouseholdMutations()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dob, setDob] = useState('')
  const [phone, setPhone] = useState('')
  const [household, setHousehold] = useState<HouseholdChoice | null>(null)

  const [showHouseholdModal, setShowHouseholdModal] = useState(false)
  const [showCreateHouseholdModal, setShowCreateHouseholdModal] = useState(false)
  const [householdSearch, setHouseholdSearch] = useState('')
  const debouncedHouseholdSearch = useDebouncedValue(householdSearch, 300)

  const [newHouseholdStreet1, setNewHouseholdStreet1] = useState('')
  const [newHouseholdStreet2, setNewHouseholdStreet2] = useState('')
  const [newHouseholdCity, setNewHouseholdCity] = useState('')
  const [newHouseholdState, setNewHouseholdState] = useState('TN')
  const [newHouseholdZip, setNewHouseholdZip] = useState('')

  const householdSearchQuery = useQuery({
    queryKey: ['households', 'search', debouncedHouseholdSearch],
    enabled: debouncedHouseholdSearch.trim().length > 0,
    queryFn: () => {
      const params = new URLSearchParams()
      params.set('search', debouncedHouseholdSearch.trim())
      params.set('page', '1')
      params.set('pageSize', '10')
      params.set('sort', 'lastActivityAt')
      return apiGet<HouseholdListResponse>(`/households?${params.toString()}`)
    },
  })

  const resetNewHouseholdForm = () => {
    setNewHouseholdStreet1('')
    setNewHouseholdStreet2('')
    setNewHouseholdCity('')
    setNewHouseholdState('TN')
    setNewHouseholdZip('')
  }

  const handleCreateHousehold = (e: FormEvent) => {
    e.preventDefault()

    const payload = {
      street1: newHouseholdStreet1.trim(),
      street2: newHouseholdStreet2 || null,
      city: newHouseholdCity.trim(),
      state: newHouseholdState.trim() || 'TN',
      zip: newHouseholdZip || null,
    }

    createHousehold.mutate(payload, {
      onSuccess: (newId) => {
        const item: HouseholdListItem = {
          id: newId,
          street1: payload.street1,
          street2: payload.street2 ?? undefined,
          city: payload.city,
          state: payload.state,
          zip: payload.zip ?? undefined,
          memberCount: 0,
          lastActivityAt: null,
        }

        setHousehold(item)
        resetNewHouseholdForm()
        setShowCreateHouseholdModal(false)
      },
    })
  }

  const selectHouseholdFromList = (item: HouseholdListItem) => {
    setHousehold(item)
    setShowHouseholdModal(false)
    setHouseholdSearch('')
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    const payload = {
      householdId: household?.id ?? null,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dob: dob || null,
      phone: phone || null,
    }

    if (isEdit && id) {
      update.mutate(
        { id, payload },
        {
          onSuccess: () => navigate(`/clients/${id}`),
        },
      )
    } else {
      create.mutate(payload, {
          onSuccess: (newId) => navigate(`/clients/${newId}`),
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
        <Alert variant="danger">Unable to load client.</Alert>
      </Container>
    )
  }

  const saving = create.isPending || update.isPending
  const submitError = create.error || update.error

  return (
    <Container className="py-3" style={{ maxWidth: 720 }}>
      <h1 className="h4 mb-3">{isEdit ? 'Edit Client' : 'Add Client'}</h1>

      {submitError ? <Alert variant="danger">Unable to save. Please check the fields and try again.</Alert> : null}

      <Form onSubmit={handleSubmit} className="bg-white p-3 border rounded">
        <Stack gap={3}>
          <div className="d-flex gap-2">
            <Form.Group className="flex-grow-1" controlId="firstName">
              <Form.Label>First name</Form.Label>
              <Form.Control
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                placeholder="Jane"
              />
            </Form.Group>
            <Form.Group className="flex-grow-1" controlId="lastName">
              <Form.Label>Last name</Form.Label>
              <Form.Control
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                placeholder="Doe"
              />
            </Form.Group>
          </div>

          <div className="d-flex gap-2">
            <Form.Group className="flex-grow-1" controlId="dob">
              <Form.Label>Date of birth</Form.Label>
              <Form.Control type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
            </Form.Group>
            <Form.Group className="flex-grow-1" controlId="phone">
              <Form.Label>Phone</Form.Label>
              <PhoneInput value={phone} onChange={setPhone} />
            </Form.Group>
          </div>

          <Form.Group controlId="householdId">
            <Form.Label>Household:</Form.Label>
            <br/>
            {household ? (
              <div className="border rounded p-2 d-flex justify-content-between align-items-start gap-2">
                <div>
                  <div className="fw-semibold">{household.street1}</div>
                  <div className="text-muted small">{household.street2}</div>
                  <div className="text-muted small">
                    {[household.city, household.state].filter(Boolean).join(', ')} {household.zip ?? ''}
                  </div>
                  <div className="text-muted small">Members: {household.memberCount ?? '—'}</div>
                </div>
                <Stack direction="horizontal" gap={2} className="flex-wrap">
                  <Button variant="outline-primary" size="sm" type="button" onClick={() => setShowHouseholdModal(true)}>
                    Change
                  </Button>
                  <Button variant="outline-secondary" size="sm" type="button" onClick={() => setHousehold(null)}>
                    Remove
                  </Button>
                </Stack>
              </div>
            ) : (

              <Button variant="outline-primary" size="sm" type="button" onClick={() => setShowHouseholdModal(true)}>
                Link household
              </Button>
            )}
            <br/>
            <Form.Text className="text-muted">Optional: link this client to a household.</Form.Text>
          </Form.Group>

          <div className="d-flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Update Client' : 'Create Client'}
            </Button>
            <Button
              variant="outline-secondary"
              type="button"
              onClick={() => navigate(isEdit ? `/clients/${id}` : '/clients')}
            >
              Cancel
            </Button>
          </div>
        </Stack>
      </Form>

      <HouseholdSelectModal
        show={showHouseholdModal}
        search={householdSearch}
        onSearchChange={setHouseholdSearch}
        onHide={() => setShowHouseholdModal(false)}
        results={householdSearchQuery.data?.items ?? []}
        isLoading={householdSearchQuery.isFetching}
        onSelect={selectHouseholdFromList}
        onCreateNew={() => {
          resetNewHouseholdForm()
          setShowCreateHouseholdModal(true)
        }}
        onClear={() => setHouseholdSearch('')}
      />

      <CreateHouseholdModal
        show={showCreateHouseholdModal}
        street1={newHouseholdStreet1}
        street2={newHouseholdStreet2}
        city={newHouseholdCity}
        state={newHouseholdState}
        zip={newHouseholdZip}
        onStreet1Change={setNewHouseholdStreet1}
        onStreet2Change={setNewHouseholdStreet2}
        onCityChange={setNewHouseholdCity}
        onStateChange={setNewHouseholdState}
        onZipChange={setNewHouseholdZip}
        onHide={() => setShowCreateHouseholdModal(false)}
        onSubmit={handleCreateHousehold}
        saving={createHousehold.isPending}
      />
    </Container>
  )
}