import Button from 'react-bootstrap/Button'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Card from 'react-bootstrap/Card'
import { Link, useNavigate } from 'react-router-dom'
import { useSiteInfo } from '../hooks/useSiteInfo'
import MarkdownViewer from '../components/MarkdownViewer'
import { useAuth } from '../auth/AuthContext'

export function PublicHome() {
  const { data, isLoading, error } = useSiteInfo()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (isLoading) return <div style={{ padding: 16 }}>Loading…</div>
  if (error) return <div style={{ padding: 16 }}>Failed to load.</div>

  return (
    <div>
      <div className="bg-primary text-white py-5">
        <Container style={{ maxWidth: 1100 }}>
          <Row className="align-items-center">
            <Col md={3} className="text-center text-md-start">
              <div className="public-home-logo mx-md-0 mx-auto">
                <img src="/helpinghandslogo.png" alt="Helping Hands" style={{ width: 120, opacity: 0.95 }} />
              </div>
            </Col>

            <Col md={6} className="mt-3 mt-md-0 text-center text-md-start">
              <h1 className="display-5 fw-bold text-secondary">Helping Hands of Humphreys County</h1>
              <p className="lead text-light text-md-start">Community assistance and resources for neighbors in need.</p>
            </Col>

            <Col md={3} className="text-center text-md-end mt-3 mt-md-0">
              {user ? (
                <>
                  <Button variant="light" className="me-2" onClick={() => navigate('/dashboard')}>Go to dashboard</Button>
                  <Button variant="outline-light" onClick={() => void logout()}>Logout</Button>
                </>
              ) : (
                <Button as={Link as any} to="/login" variant="light">Staff login</Button>
              )}
            </Col>
          </Row>
        </Container>
      </div>

      <Container style={{ maxWidth: 1100 }} className="py-5">
        <Row className="g-4">
          <Col md={8}>
            <Card className="shadow-sm mb-4">
                <Card.Body>
                  <Card.Title>About</Card.Title>
                  <Card.Text>
                    <MarkdownViewer source={data?.aboutText} />
                  </Card.Text>
                </Card.Body>
            </Card>

            <Card className="shadow-sm mb-4">
                <Card.Body>
                  <Card.Title>Programs</Card.Title>
                  <Card.Text>
                    <MarkdownViewer source={data?.programsOverview} />
                  </Card.Text>
                </Card.Body>
            </Card>

            <Card className="shadow-sm mb-4">
                <Card.Body>
                  <Card.Title>What to bring</Card.Title>
                  <Card.Text>
                    <MarkdownViewer source={data?.whatToBringText} />
                  </Card.Text>
                </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="shadow-sm mb-3">
              <Card.Body>
                <Card.Title>Hours</Card.Title>
                <Card.Text>
                  <MarkdownViewer source={data?.hoursText} />
                </Card.Text>
              </Card.Body>
            </Card>

            <Card className="shadow-sm mb-3">
              <Card.Body>
                <Card.Title>Location & Contact</Card.Title>
                <Card.Text>
                  <MarkdownViewer source={data?.locationText} />
                  <br />
                  <MarkdownViewer source={data?.contactText} />
                </Card.Text>
              </Card.Body>
            </Card>
            {user && (
              <Card className="shadow-sm">
                <Card.Body>
                  <Button variant="primary" onClick={() => navigate('/dashboard')}>Open Dashboard</Button>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  )
}
