import type { Dispatch, SetStateAction } from 'react'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import ListGroup from 'react-bootstrap/ListGroup'
import Modal from 'react-bootstrap/Modal'
import Spinner from 'react-bootstrap/Spinner'
import Stack from 'react-bootstrap/Stack'
import type { UserListItem } from '../../types/users'

type Props = {
  show: boolean
  search: string
  onSearchChange: Dispatch<SetStateAction<string>>
  onHide: () => void
  results: UserListItem[]
  isLoading: boolean
  onSelect: (item: UserListItem) => void
  onClear: () => void
}

export function UserSelectModal({
  show,
  search,
  onSearchChange,
  onHide,
  results,
  isLoading,
  onSelect,
  onClear,
}: Props) {
  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Select verifier</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Control
          placeholder="Search users by name or email"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          autoFocus
        />

        <div className="mt-3">
          {search.trim().length === 0 ? <div className="text-muted small">Start typing to search users.</div> : null}
          {isLoading ? <Spinner animation="border" size="sm" /> : null}
          <ListGroup className="mt-2">
            {search.trim().length > 0
              ? results.map((item) => (
                  <ListGroup.Item key={item.id} className="d-flex justify-content-between align-items-start gap-2">
                    <div>
                      <div className="fw-semibold">{item.displayName}</div>
                      <div className="text-muted small">{item.email}</div>
                      <div className="text-muted small">{item.isActive ? 'Active' : 'Inactive'}</div>
                    </div>
                    <Button size="sm" variant="primary" type="button" onClick={() => onSelect(item)}>
                      Select
                    </Button>
                  </ListGroup.Item>
                ))
              : null}
          </ListGroup>
          {search.trim().length > 0 && !isLoading && results.length === 0 ? (
            <div className="text-muted small">No users found.</div>
          ) : null}
        </div>

        <Stack direction="horizontal" gap={2} className="mt-3 flex-wrap">
          <Button variant="link" size="sm" type="button" onClick={onClear}>
            Clear search
          </Button>
        </Stack>
      </Modal.Body>
    </Modal>
  )
}
