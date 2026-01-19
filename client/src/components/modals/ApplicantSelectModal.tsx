import type { Dispatch, SetStateAction } from 'react'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import ListGroup from 'react-bootstrap/ListGroup'
import Modal from 'react-bootstrap/Modal'
import Spinner from 'react-bootstrap/Spinner'
import Stack from 'react-bootstrap/Stack'
import type { ClientListItem } from '../../types/clients'

type Props = {
  show: boolean
  search: string
  onSearchChange: Dispatch<SetStateAction<string>>
  onHide: () => void
  results: ClientListItem[]
  isLoading: boolean
  onSelect: (client: ClientListItem) => void
  onCreateNew: () => void
  onClear: () => void
}

export function ApplicantSelectModal({
  show,
  search,
  onSearchChange,
  onHide,
  results,
  isLoading,
  onSelect,
  onCreateNew,
  onClear,
}: Props) {
  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Select applicant</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Control
          placeholder="Search clients by name, phone, or ID"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          autoFocus
        />

        <div className="mt-3">
          {search.trim().length === 0 ? <div className="text-muted small">Start typing to search clients.</div> : null}
          {isLoading ? <Spinner animation="border" size="sm" /> : null}
          <ListGroup className="mt-2">
            {search.trim().length > 0
              ? results.map((client) => (
                  <ListGroup.Item key={client.id} className="d-flex justify-content-between align-items-start gap-2">
                    <div>
                      <div className="fw-semibold">{client.firstName} {client.lastName}</div>
                      <div className="text-muted small">{client.dob ? `DOB ${client.dob}` : 'DOB unknown'}</div>
                      {client.street1 ? (
                        <div className="text-muted small">{client.street1}{client.city ? `, ${client.city}` : ''}{client.state ? `, ${client.state}` : ''}</div>
                      ) : null}
                    </div>
                    <Button size="sm" variant="primary" type="button" onClick={() => onSelect(client)}>
                      Use applicant
                    </Button>
                  </ListGroup.Item>
                ))
              : null}
          </ListGroup>
          {search.trim().length > 0 && !isLoading && results.length === 0 ? (
            <div className="text-muted small">No clients found.</div>
          ) : null}
        </div>

        <Stack direction="horizontal" gap={2} className="mt-3 flex-wrap">
          <Button variant="outline-secondary" size="sm" type="button" onClick={onCreateNew}>
            Add new client
          </Button>
          <Button variant="link" size="sm" type="button" onClick={onClear}>
            Clear search
          </Button>
        </Stack>
      </Modal.Body>
    </Modal>
  )
}
