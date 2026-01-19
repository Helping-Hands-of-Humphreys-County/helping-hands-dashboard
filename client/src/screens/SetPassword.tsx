import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import Container from 'react-bootstrap/Container'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Alert from 'react-bootstrap/Alert'
import { apiPost } from '../api/http'

export function SetPassword() {
  const { refreshMe } = useAuth()
  const navigate = useNavigate()
  const loc = useLocation()
  const state = (loc.state as any) || {}
  const [currentPassword] = useState(state.currentPassword ?? '')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!newPassword) {
      setError('Enter a new password')
      return
    }
    if (newPassword !== confirm) {
      setError('Passwords do not match')
      return
    }

    setIsSubmitting(true)
    try {
      await apiPost<void>('/auth/change-password', { currentPassword, newPassword })
      await refreshMe()
      navigate('/dashboard')
    } catch (e: unknown) {
      const obj = typeof e === 'object' && e !== null ? (e as Record<string, unknown>) : null
      const msg = typeof obj?.message === 'string' ? obj.message : null
      setError(msg ?? 'Failed to change password')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Container className="py-4" style={{ maxWidth: 420 }}>
      <h1 className="h3 mb-3">Set your password</h1>
      {error && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={onSubmit}>
        <Form.Group className="mb-3" controlId="new">
          <Form.Label>New password</Form.Label>
          <Form.Control value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" required />
        </Form.Group>

        <Form.Group className="mb-3" controlId="confirm">
          <Form.Label>Confirm password</Form.Label>
          <Form.Control value={confirm} onChange={(e) => setConfirm(e.target.value)} type="password" required />
        </Form.Group>

        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save password'}</Button>
      </Form>
    </Container>
  )
}
