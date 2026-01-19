import type { FormEvent } from 'react'
import { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiGet } from '../api/http'
import type { UserDetails } from '../types/users'
import { useMutation } from '@tanstack/react-query'
import { apiPost } from '../api/http'
import { useAuth } from '../auth/AuthContext'
import Alert from 'react-bootstrap/Alert'
import Badge from 'react-bootstrap/Badge'
import Button from 'react-bootstrap/Button'
import Container from 'react-bootstrap/Container'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'
import Stack from 'react-bootstrap/Stack'
import { DataTable } from '../components/table/DataTable'
import { TableToolbar } from '../components/table/TableToolbar'
import { PaginationBar } from '../components/table/PaginationBar'
import { useTableState } from '../hooks/useTableState'
import { useUsersList } from '../hooks/useUsersList'
import { useUserMutations } from '../hooks/useUserMutations'
import type { UserListItem } from '../types/users'
import type { ApiError } from '../api/http'

function toDateText(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleString()
}

export function UsersList() {
  const table = useTableState()
  const { data, isLoading, error } = useUsersList(table)
  const { create, update, activate, deactivate } = useUserMutations()
  const { user: me } = useAuth()

  const rows = data?.items ?? []
  const togglePending = activate.isPending || deactivate.isPending
  const [searchParams] = useSearchParams()

  const [showModal, setShowModal] = useState(false)
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const [inviteToken, setInviteToken] = useState<string | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)

  const saving = create.isPending || update.isPending

  const modalTitle = mode === 'create' ? 'Add User' : 'Edit User'

  const openCreate = () => {
    setMode('create')
    setEditingId(null)
    setDisplayName('')
    setEmail('')
    setFormError(null)
    setShowModal(true)
  }

  const openEdit = (user: UserListItem) => {
    if (me?.id !== user.id) return
    setMode('edit')
    setEditingId(user.id)
    setDisplayName(user.displayName)
    setEmail(user.email)
    setFormError(null)
    setCurrentPassword('')
    setNewPassword('')
    setShowModal(true)
  }

  useEffect(() => {
    const editSelf = searchParams.get('editSelf')
    if (!editSelf) return
    if (!me?.id) return

    // load current user's details and open modal
    ;(async () => {
      try {
        const dto = await apiGet<UserDetails>(`/users/${me.id}`)
        openEdit(dto)
      } catch {
        // ignore
      }
    })()
  }, [searchParams, me])

  const closeModal = () => {
    setShowModal(false)
    setFormError(null)
  }

  const changePassword = useMutation({
    mutationFn: ({ current, next }: { current: string; next: string }) =>
      apiPost<void>('/auth/change-password', { currentPassword: current, newPassword: next }),
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!displayName.trim()) {
      setFormError('Display name is required.')
      return
    }
    if (!email.trim()) {
      setFormError('Email is required.')
      return
    }
    // Password is optional for invite flow; backend will return an invite token when omitted.

    setFormError(null)

    if (mode === 'create') {
      create.mutate(
        { displayName: displayName.trim(), email: email.trim() },
        {
          onSuccess: (data) => {
            setShowModal(false)
            const token = data?.inviteToken ?? null
                if (token) {
                  setInviteToken(token)
                  setShowInviteModal(true)
                } else {
                  setSuccessMessage('User created. Account password is set to the default: #H3lpingH4nds — user will be required to change it on first login.')
                  window.setTimeout(() => setSuccessMessage(null), 8000)
                }
          },
          onError: (err) => setFormError(((err as unknown) as ApiError).message ?? 'Unable to create user.'),
        },
      )
    } else if (editingId) {
      update.mutate(
        { id: editingId, payload: { displayName: displayName.trim(), email: email.trim() } },
        {
          onSuccess: () => {
            // If password change requested (and editing self), call change-password endpoint
            if (newPassword) {
              if (!currentPassword) {
                setFormError('Current password is required to change password.')
                return
              }
              changePassword.mutate(
                { current: currentPassword, next: newPassword },
                {
                  onSuccess: () => {
                    setShowModal(false)
                    setSuccessMessage('Profile updated and password changed.')
                    window.setTimeout(() => setSuccessMessage(null), 8000)
                  },
                  onError: (err) => setFormError(((err as unknown) as ApiError).message ?? 'Unable to change password.'),
                },
              )
            } else {
              setShowModal(false)
            }
          },
          onError: (err) => setFormError(((err as unknown) as ApiError).message ?? 'Unable to update user.'),
        },
      )
    }
  }

  const actionError = useMemo(() => {
    const errs = [activate.error, deactivate.error]
    const first = errs.find(Boolean) as ApiError | undefined
    return first?.message
  }, [activate.error, deactivate.error])

  return (
    <Container className="py-3">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h1 className="h4 mb-0">Users</h1>
          <div className="text-muted small">Manage dashboard accounts.</div>
        </div>
        <Button onClick={openCreate}>Add User</Button>
      </div>

      <TableToolbar
        search={table.search}
        onSearchChange={table.setSearch}
        onSearchClear={() => table.setSearch('')}
        placeholder="Search users"
      />

      {actionError ? <Alert variant="danger" className="mt-2">{actionError}</Alert> : null}
      {successMessage ? <Alert variant="success" className="mt-2">{successMessage}</Alert> : null}

      <DataTable<UserListItem>
        columns={[
          {
            label: 'Name',
            sortKey: 'displayName',
            render: (row) => (
              <div>
                <div className="fw-semibold">{row.displayName}</div>
                <div className="text-muted small">Updated {toDateText(row.updatedAt)}</div>
              </div>
            ),
          },
          {
            label: 'Email',
            sortKey: 'email',
            render: (row) => <div className="text-muted small">{row.email}</div>,
          },
          {
            label: 'Status',
            sortKey: 'isActive',
            className: 'text-nowrap',
            render: (row) => (
              <Badge bg={row.isActive ? 'success' : 'secondary'}>{row.isActive ? 'Active' : 'Inactive'}</Badge>
            ),
          },
          {
            label: 'Updated',
            sortKey: 'updatedAt',
            className: 'text-nowrap',
            render: (row) => toDateText(row.updatedAt),
          },
          {
            label: 'Actions',
            className: 'text-nowrap',
            render: (row) => (
              <Stack direction="horizontal" gap={1}>
                {me?.id === row.id ? (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      openEdit(row)
                    }}
                  >
                    Edit
                  </Button>
                ) : null}
                {!(row.isActive && me?.id === row.id) ? (
                  <Button
                    variant={row.isActive ? 'outline-danger' : 'outline-success'}
                    size="sm"
                    disabled={togglePending}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (row.isActive) deactivate.mutate(row.id)
                      else activate.mutate(row.id)
                    }}
                  >
                    {row.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                ) : null}
              </Stack>
            ),
          },
        ]}
        rows={rows}
        getRowKey={(row) => row.id}
        sort={table.sort}
        onSortChange={table.setSort}
        onRowClick={(row) => {
          if (me?.id === row.id) openEdit(row)
        }}
        isLoading={isLoading}
        error={error}
        emptyText="No users found."
      />

      {data ? (
        <PaginationBar
          page={table.page}
          pageSize={table.pageSize}
          total={data.totalCount}
          onPageChange={table.setPage}
        />
      ) : null}

      <Modal show={showModal} onHide={closeModal} centered>
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>{modalTitle}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {formError ? <Alert variant="danger">{formError}</Alert> : null}
            <Stack gap={3}>
              <Form.Group controlId="userDisplayName">
                <Form.Label>Display name</Form.Label>
                <Form.Control
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Jane Doe"
                  required
                />
              </Form.Group>
              <Form.Group controlId="userEmail">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                />
              </Form.Group>
              {mode === 'edit' && editingId === me?.id ? (
                <>
                  <div className="small text-muted">Change password (optional)</div>
                  <Form.Group controlId="currentPassword">
                    <Form.Label>Current password</Form.Label>
                    <Form.Control
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Current password"
                    />
                  </Form.Group>
                  <Form.Group controlId="newPassword">
                    <Form.Label>New password</Form.Label>
                    <Form.Control
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New password"
                    />
                  </Form.Group>
                </>
              ) : null}
              {/* Password is not collected in the UI; the server will produce a reset token for invite flows. */}
            </Stack>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={closeModal} disabled={saving || changePassword.isLoading}>
              Cancel
            </Button>
                <Button type="submit" disabled={saving || changePassword.isLoading}>
                  {saving || changePassword.isLoading ? 'Saving...' : 'Save user'}
              </Button>
          </Modal.Footer>
        </Form>
      </Modal>
      <Modal show={showInviteModal} onHide={() => setShowInviteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Invite token</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="small text-muted">Copy this token and share it with the new user (dev only).</p>
          <Form.Group>
            <Form.Control as="textarea" readOnly value={inviteToken ?? ''} rows={3} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => {
              if (inviteToken) {
                try {
                  navigator.clipboard.writeText(inviteToken)
                } catch {
                  // ignore
                }
              }
            }}
          >
            Copy
          </Button>
          <Button onClick={() => setShowInviteModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}
