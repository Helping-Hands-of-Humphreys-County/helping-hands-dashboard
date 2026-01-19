import type { Dispatch, SetStateAction } from 'react'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import ListGroup from 'react-bootstrap/ListGroup'
import Modal from 'react-bootstrap/Modal'
import Spinner from 'react-bootstrap/Spinner'
import Stack from 'react-bootstrap/Stack'
import type { HouseholdListItem } from '../../types/households'

type Props = {
  show: boolean
  search: string
  onSearchChange: Dispatch<SetStateAction<string>>
  onHide: () => void
  results: HouseholdListItem[]
  isLoading: boolean
  onSelect: (item: HouseholdListItem) => void
  onCreateNew: () => void
  onClear: () => void
}

export function HouseholdSelectModal({
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
        <Modal.Title>Select household</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Control
          placeholder="Search households by address or ID"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          autoFocus
        />

        <div className="mt-3">
          {search.trim().length === 0 ? <div className="text-muted small">Start typing to search households.</div> : null}
          {isLoading ? <Spinner animation="border" size="sm" /> : null}
          <ListGroup className="mt-2">
            {search.trim().length > 0
              ? results.map((item) => (
                  <ListGroup.Item key={item.id} className="d-flex justify-content-between align-items-start gap-2">
                    <div>
                      <div className="fw-semibold">Household</div>
                      <div className="text-muted small">{item.street1}</div>
                      <div className="text-muted small">{[item.city, item.state].filter(Boolean).join(', ')} {item.zip ?? ''}</div>
                      <div className="text-muted small">Members: {item.memberCount}</div>
                    </div>
                    <Button size="sm" variant="primary" type="button" onClick={() => onSelect(item)}>
                      Use household
                    </Button>
                  </ListGroup.Item>
                ))
              : null}
          </ListGroup>
          {search.trim().length > 0 && !isLoading && results.length === 0 ? (
            <div className="text-muted small">No households found.</div>
          ) : null}
        </div>

        <Stack direction="horizontal" gap={2} className="mt-3 flex-wrap">
          <Button variant="outline-secondary" size="sm" type="button" onClick={onCreateNew}>
            Add new household
          </Button>
          <Button variant="link" size="sm" type="button" onClick={onClear}>
            Clear search
          </Button>
        </Stack>
      </Modal.Body>
    </Modal>
  )
}
