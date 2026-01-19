import type { FormEvent } from 'react'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'
import Stack from 'react-bootstrap/Stack'

type Props = {
  show: boolean
  street1: string
  street2: string
  city: string
  state: string
  zip: string
  onStreet1Change: (value: string) => void
  onStreet2Change: (value: string) => void
  onCityChange: (value: string) => void
  onStateChange: (value: string) => void
  onZipChange: (value: string) => void
  onHide: () => void
  onSubmit: (e: FormEvent) => void
  saving: boolean
}

export function CreateHouseholdModal({
  show,
  street1,
  street2,
  city,
  state,
  zip,
  onStreet1Change,
  onStreet2Change,
  onCityChange,
  onStateChange,
  onZipChange,
  onHide,
  onSubmit,
  saving,
}: Props) {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Add household</Modal.Title>
      </Modal.Header>
      <Form onSubmit={onSubmit}>
        <Modal.Body>
          <Stack gap={3}>
            <Form.Group controlId="newHouseholdStreet1">
              <Form.Label>Street address</Form.Label>
              <Form.Control value={street1} onChange={(e) => onStreet1Change(e.target.value)} required />
            </Form.Group>
            <Form.Group controlId="newHouseholdStreet2">
              <Form.Label>Address line 2</Form.Label>
              <Form.Control value={street2} onChange={(e) => onStreet2Change(e.target.value)} />
            </Form.Group>
            <div className="d-flex gap-2 flex-wrap">
              <Form.Group className="flex-grow-1" controlId="newHouseholdCity">
                <Form.Label>City</Form.Label>
                <Form.Control value={city} onChange={(e) => onCityChange(e.target.value)} required />
              </Form.Group>
              <Form.Group style={{ minWidth: 120 }} controlId="newHouseholdState">
                <Form.Label>State</Form.Label>
                <Form.Control value={state} onChange={(e) => onStateChange(e.target.value)} required />
              </Form.Group>
              <Form.Group style={{ minWidth: 120 }} controlId="newHouseholdZip">
                <Form.Label>ZIP</Form.Label>
                <Form.Control value={zip} onChange={(e) => onZipChange(e.target.value)} />
              </Form.Group>
            </div>
          </Stack>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" type="button" onClick={onHide}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save household'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
