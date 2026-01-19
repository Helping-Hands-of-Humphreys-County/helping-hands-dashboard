import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Container from 'react-bootstrap/Container'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Alert from 'react-bootstrap/Alert'
import { apiPost } from '../api/http'

export function ResetPassword() {
  const [search] = useSearchParams()
  const tokenFromQuery = search.get('token') ?? ''
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [token, setToken] = useState(tokenFromQuery)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (!password) {
      setError('Password is required.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    try {
      await apiPost<void>('/auth/reset-password', { email, token, password })
      setMessage('Password has been reset. Redirecting to login...')
      setTimeout(() => navigate('/login'), 1500)
    } catch (err: unknown) {
      const obj = typeof err === 'object' && err !== null ? (err as Record<string, unknown>) : null
      const msg = typeof obj?.message === 'string' ? obj.message : null
      setError(msg ?? 'Unable to reset password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Container className="py-4" style={{ maxWidth: 420 }}>
      <h1 className="h3 mb-3">Reset password</h1>
      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={onSubmit}>
        <Form.Group className="mb-3" controlId="email">
          <Form.Label>Email</Form.Label>
          <Form.Control value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </Form.Group>

        <Form.Group className="mb-3" controlId="token">
          <Form.Label>Reset token</Form.Label>
          <Form.Control value={token} onChange={(e) => setToken(e.target.value)} required />
          <Form.Text className="text-muted">You may have received this token by email.</Form.Text>
        </Form.Group>

        <Form.Group className="mb-3" controlId="password">
          <Form.Label>New password</Form.Label>
          <Form.Control value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </Form.Group>

        <Form.Group className="mb-3" controlId="confirm">
          <Form.Label>Confirm password</Form.Label>
          <Form.Control value={confirm} onChange={(e) => setConfirm(e.target.value)} type="password" required />
        </Form.Group>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Resetting…' : 'Reset password'}
        </Button>
      </Form>
    </Container>
  )
}
