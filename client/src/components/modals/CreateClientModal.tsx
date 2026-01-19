import type { FormEvent } from 'react'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import { PhoneInput } from '../PhoneInput'
import Modal from 'react-bootstrap/Modal'
import Stack from 'react-bootstrap/Stack'

type Props = {
  show: boolean
  firstName: string
  lastName: string
  dob: string
  phone: string
  onFirstNameChange: (value: string) => void
  onLastNameChange: (value: string) => void
  onDobChange: (value: string) => void
  onPhoneChange: (value: string) => void
  onHide: () => void
  onSubmit: (e: FormEvent) => void
  saving: boolean
  linkToHousehold?: boolean
}

export function CreateClientModal({
  show,
  firstName,
  lastName,
  dob,
  phone,
  onFirstNameChange,
  onLastNameChange,
  onDobChange,
  onPhoneChange,
  onHide,
  onSubmit,
  saving,
  linkToHousehold,
}: Props) {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Add client</Modal.Title>
      </Modal.Header>
      <Form onSubmit={onSubmit}>
        <Modal.Body>
          <Stack gap={3}>
            <div className="d-flex gap-2">
              <Form.Group className="flex-grow-1" controlId="newClientFirstName">
                <Form.Label>First name</Form.Label>
                <Form.Control value={firstName} onChange={(e) => onFirstNameChange(e.target.value)} required />
              </Form.Group>
              <Form.Group className="flex-grow-1" controlId="newClientLastName">
                <Form.Label>Last name</Form.Label>
                <Form.Control value={lastName} onChange={(e) => onLastNameChange(e.target.value)} required />
              </Form.Group>
            </div>

            <div className="d-flex gap-2">
              <Form.Group className="flex-grow-1" controlId="newClientDob">
                <Form.Label>Date of birth</Form.Label>
                <Form.Control type="date" value={dob} onChange={(e) => onDobChange(e.target.value)} />
              </Form.Group>
              <Form.Group className="flex-grow-1" controlId="newClientPhone">
                <Form.Label>Phone</Form.Label>
                <PhoneInput value={phone} onChange={onPhoneChange} />
              </Form.Group>
            </div>

            {linkToHousehold ? <div className="text-muted small">This client will be linked to the selected household.</div> : null}
          </Stack>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" type="button" onClick={onHide}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save client'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
