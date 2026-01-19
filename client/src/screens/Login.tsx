import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import Container from 'react-bootstrap/Container'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Alert from 'react-bootstrap/Alert'
import { Link } from 'react-router-dom'

export function Login() {
  const { login, isLoading, isDisabled } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    try {
      await login(email, password)
      // If user must change password, redirect to set-password screen
      if ((window as any).__auth_user__?.mustChangePassword) {
        // pass current password via state so user doesn't need to re-enter it
        navigate('/set-password', { state: { email, currentPassword: password } })
      } else {
        navigate('/dashboard')
      }
    } catch (err: unknown) {
      const obj = typeof err === 'object' && err !== null ? (err as Record<string, unknown>) : null
      const msg = typeof obj?.message === 'string' ? obj.message : null
      setError(msg ?? 'Login failed.')
    }
  }

  return (
    <Container className="py-4" style={{ maxWidth: 420 }}>
      <h1 className="h3 mb-3">Login</h1>
      {isDisabled && <Alert variant="warning">Account Disabled</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={onSubmit}>
        <Form.Group className="mb-3" controlId="email">
          <Form.Label>Email</Form.Label>
          <Form.Control
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            autoComplete="email"
          />
        </Form.Group>
        <Form.Group className="mb-3" controlId="password">
          <Form.Label>Password</Form.Label>
          <Form.Control
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            autoComplete="current-password"
          />
        </Form.Group>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Signing in…' : 'Sign in'}
        </Button>
        <div className="mt-3">
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
      </Form>
    </Container>
  )
}
