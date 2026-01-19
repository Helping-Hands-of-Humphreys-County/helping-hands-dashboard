import type { FormEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import Alert from 'react-bootstrap/Alert'
import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import Container from 'react-bootstrap/Container'
import Form from 'react-bootstrap/Form'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Spinner from 'react-bootstrap/Spinner'
import Stack from 'react-bootstrap/Stack'
import { useNavigate, useParams } from 'react-router-dom'
import { useAssistanceDetails } from '../hooks/useAssistanceDetails'
import type { AssistanceEventDetails } from '../types/assistance'
import { useAssistanceMutations } from '../hooks/useAssistanceMutations'
import type { AssistanceItem } from '../types/assistance'

function toDateTimeLocal(value?: string | null) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

export function AssistanceForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const hydratedForId = useRef<string | null>(null)

  const { isLoading, error } = useAssistanceDetails(id, {
    onSuccess: (event: AssistanceEventDetails | undefined | null) => {
      if (!event || hydratedForId.current === event.id) return
      hydratedForId.current = event.id

      setProgramType(event.programType)
      setOccurredAt(toDateTimeLocal(event.occurredAt))
      setHouseholdId(event.householdId)
      setClientId(event.clientId ?? '')
      setApplicationId(event.applicationId ?? '')
      setBillType(event.billType ?? '')
      setAmountPaid(event.amountPaid != null ? String(event.amountPaid) : '')
      setCheckNumber(event.checkNumber ?? '')
      setNotes(event.notes ?? '')
      setItems(event.items.length ? event.items : [{ itemType: 'Food box', quantity: 1 }])
    },
    onError: () => {
      hydratedForId.current = null
    },
  })
  const { create, update } = useAssistanceMutations()

  const [programType, setProgramType] = useState('FoodPantry')
  const [occurredAt, setOccurredAt] = useState(() => toDateTimeLocal(new Date().toISOString()))
  const [householdId, setHouseholdId] = useState('')
  const [clientId, setClientId] = useState('')
  const [applicationId, setApplicationId] = useState('')
  const [billType, setBillType] = useState('')
  const [amountPaid, setAmountPaid] = useState('')
  const [checkNumber, setCheckNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<AssistanceItem[]>([{ itemType: 'Food box', quantity: 1 }])

  const normalizedItems = useMemo(
    () => items.filter((i) => i.itemType.trim()),
    [items],
  )

  // Keep items / bill fields in sync with program type
  useEffect(() => {
    if (programType === 'FoodPantry') {
      setItems((prev) => (prev && prev.length ? prev : [{ itemType: 'Food box', quantity: 1 }]))
    } else {
      // HelpingHands (or other non-food programs) don't use items by default
      setItems([])
    }
  }, [programType])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    const itemsPayload =
      programType === 'FoodPantry'
        ? normalizedItems.map((item) => ({
            itemType: item.itemType,
            quantity: Number(item.quantity) || 0,
          }))
        : []

    const payloadBase = {
      occurredAt: occurredAt ? new Date(occurredAt).toISOString() : new Date().toISOString(),
      householdId,
      clientId: clientId || null,
      applicationId: applicationId || null,
      billType: billType || null,
      amountPaid: amountPaid ? Number(amountPaid) : null,
      checkNumber: checkNumber || null,
      notes: notes || null,
      items: itemsPayload,
    }

    if (isEdit && id) {
      update.mutate(
        { id, payload: payloadBase },
        {
          onSuccess: () => navigate('/assistance'),
        },
      )
    } else {
      create.mutate(
        { ...payloadBase, programType },
        {
          onSuccess: () => navigate('/assistance'),
        },
      )
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
        <Alert variant="danger">Unable to load assistance event.</Alert>
      </Container>
    )
  }

  const saving = create.isPending || update.isPending
  const submitError = create.error || update.error

  return (
    <Container className="py-3" style={{ maxWidth: 1000 }}>
      <h1 className="h4 mb-3">{isEdit ? 'Edit Assistance Event' : 'Record Assistance'}</h1>

      {submitError ? <Alert variant="danger">Unable to save assistance record.</Alert> : null}

      <Form onSubmit={handleSubmit} className="bg-white p-3 border rounded">
        <Stack gap={3}>
          <Row className="g-3">
            <Col md={4}>
              <Form.Group controlId="programType">
                <Form.Label>Program</Form.Label>
                <Form.Select
                  value={programType}
                  onChange={(e) => setProgramType(e.target.value)}
                  disabled={isEdit}
                >
                  <option value="FoodPantry">Food Pantry</option>
                  <option value="HelpingHands">Helping Hands</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="occurredAt">
                <Form.Label>Date and time</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={occurredAt}
                  onChange={(e) => setOccurredAt(e.target.value)}
                  required
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <div className="small text-muted">Linked household</div>
              {householdId ? (
                <div className="fw-semibold">{householdId}</div>
              ) : (
                <div className="text-muted">Not linked — open this form from a household or application to auto-link.</div>
              )}
            </Col>
          </Row>

          <Row className="g-3">
            <Col md={4}>
              <div className="small text-muted">Linked person</div>
              {clientId ? <div className="fw-semibold">{clientId}</div> : <div className="text-muted">Not linked</div>}
            </Col>
            <Col md={4}>
              <div className="small text-muted">Linked application</div>
              {applicationId ? <div className="fw-semibold">{applicationId}</div> : <div className="text-muted">Not linked</div>}
            </Col>
            <Col md={4}>
              {programType !== 'FoodPantry' ? (
                <Form.Group controlId="billType">
                  <Form.Label>Bill type</Form.Label>
                  <Form.Control
                    value={billType}
                    onChange={(e) => setBillType(e.target.value)}
                    placeholder="Rent, power, etc."
                  />
                </Form.Group>
              ) : null}
            </Col>
          </Row>

          {programType !== 'FoodPantry' ? (
            <Row className="g-3">
              <Col md={4}>
                <Form.Group controlId="amountPaid">
                  <Form.Label>Amount paid</Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder="Optional"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="checkNumber">
                  <Form.Label>Check number</Form.Label>
                  <Form.Control value={checkNumber} onChange={(e) => setCheckNumber(e.target.value)} />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="notes">
                  <Form.Label>Notes</Form.Label>
                  <Form.Control value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
                </Form.Group>
              </Col>
            </Row>
          ) : (
            <Row className="g-3">
              <Col>
                <Form.Group controlId="notes">
                  <Form.Label>Notes</Form.Label>
                  <Form.Control value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
                </Form.Group>
              </Col>
            </Row>
          )}

          {programType === 'FoodPantry' ? (
            <Card>
            <Card.Body>
              <Card.Title className="h6">Items (Food Pantry)</Card.Title>
              <Stack gap={3}>
                {items.map((item, idx) => (
                  <Row className="g-3 align-items-end" key={idx}>
                    <Col md={6}>
                      <Form.Group controlId={`item-type-${idx}`}>
                        <Form.Label>Item</Form.Label>
                        <Form.Control
                          value={item.itemType}
                          onChange={(e) => {
                            const next = [...items]
                            next[idx] = { ...item, itemType: e.target.value }
                            setItems(next)
                          }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group controlId={`item-qty-${idx}`}>
                        <Form.Label>Quantity</Form.Label>
                        <Form.Control
                          type="number"
                          min={0}
                          value={item.quantity}
                          onChange={(e) => {
                            const next = [...items]
                            const val = e.target.value
                            next[idx] = { ...item, quantity: val ? Number(val) : 0 }
                            setItems(next)
                          }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3} className="d-flex">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        type="button"
                        onClick={() => setItems(items.filter((_, i) => i !== idx))}
                        disabled={items.length === 1}
                      >
                        Remove
                      </Button>
                    </Col>
                  </Row>
                ))}

                <Button
                  variant="outline-primary"
                  size="sm"
                  type="button"
                  onClick={() => setItems([...items, { itemType: 'Food box', quantity: 1 }])}
                >
                  Add item
                </Button>
              </Stack>
            </Card.Body>
          </Card>
          ) : null}

          <Stack direction="horizontal" gap={2}>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Update Assistance' : 'Create Assistance'}
            </Button>
            <Button variant="outline-secondary" type="button" onClick={() => navigate('/assistance')}>
              Cancel
            </Button>
          </Stack>
        </Stack>
      </Form>
    </Container>
  )
}