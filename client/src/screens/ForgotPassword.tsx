import { useState } from 'react'
import Container from 'react-bootstrap/Container'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Alert from 'react-bootstrap/Alert'
import { apiPost } from '../api/http'
import { useNavigate } from 'react-router-dom'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setIsSubmitting(true)

    try {
      await apiPost<void>('/auth/forgot-password', { email })
      setMessage('If an account exists for that email, instructions have been sent.')
      // optionally navigate back to login after a short delay
      setTimeout(() => navigate('/login'), 2500)
    } catch (err: unknown) {
      const obj = typeof err === 'object' && err !== null ? (err as Record<string, unknown>) : null
      const msg = typeof obj?.message === 'string' ? obj.message : null
      setError(msg ?? 'Unable to send reset email.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Container className="py-4" style={{ maxWidth: 420 }}>
      <h1 className="h3 mb-3">Forgot password</h1>
      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={onSubmit}>
        <Form.Group className="mb-3" controlId="email">
          <Form.Label>Email</Form.Label>
          <Form.Control value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </Form.Group>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Sending…' : 'Send reset email'}
        </Button>
      </Form>
    </Container>
  )
}
