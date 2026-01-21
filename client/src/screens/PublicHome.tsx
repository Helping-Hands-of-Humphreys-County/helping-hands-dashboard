import { useEffect, useMemo, useState } from 'react'
import Button from 'react-bootstrap/Button'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Card from 'react-bootstrap/Card'
import Toast from 'react-bootstrap/Toast'
import ToastContainer from 'react-bootstrap/ToastContainer'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFloppyDisk, faPenToSquare, faXmark } from '@fortawesome/free-solid-svg-icons'
import { Link, useNavigate } from 'react-router-dom'
import { useSiteInfo, useSiteInfoMutations } from '../hooks/useSiteInfo'
import MarkdownViewer from '../components/MarkdownViewer'
import RichTextMarkdownEditor from '../components/RichTextMarkdownEditor'
import type { UpdateSiteInfoRequest } from '../types/siteInfo'
import { useAuth } from '../auth/AuthContext'

export function PublicHome() {
  const { data, isLoading, error } = useSiteInfo()
  const { update } = useSiteInfoMutations()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const initialForm = useMemo<UpdateSiteInfoRequest | null>(() => {
    if (!data) return null
    return {
      aboutText: data.aboutText ?? '',
      programsOverview: data.programsOverview ?? '',
      hoursText: data.hoursText ?? '',
      locationText: data.locationText ?? '',
      contactText: data.contactText ?? '',
      whatToBringText: data.whatToBringText ?? '',
    }
  }, [data])

  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<UpdateSiteInfoRequest | null>(initialForm)
  const [toast, setToast] = useState<{ show: boolean; message: string; variant: 'success' | 'danger' } | null>(
    null,
  )

  useEffect(() => {
    setForm(initialForm)
  }, [initialForm])

  async function handleSave() {
    if (!form) return
    try {
      await update.mutateAsync(form)
      setToast({ show: true, message: 'Site info saved.', variant: 'success' })
      setIsEditing(false)
    } catch (err) {
      console.error(err)
      setToast({ show: true, message: 'Save failed. Please try again.', variant: 'danger' })
    }
  }

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
        {user && (
          <div className="d-flex justify-content-end mb-3 gap-2">
            {isEditing ? (
              <>
                <Button variant="secondary" onClick={() => setIsEditing(false)} disabled={update.isPending}>
                  <FontAwesomeIcon icon={faXmark} className="me-2" /> Cancel
                </Button>
                <Button variant="success" onClick={() => void handleSave()} disabled={update.isPending}>
                  <FontAwesomeIcon icon={faFloppyDisk} className="me-2" />
                  {update.isPending ? 'Saving…' : 'Save'}
                </Button>
              </>
            ) : (
              <Button variant="outline-primary" onClick={() => setIsEditing(true)}>
                <FontAwesomeIcon icon={faPenToSquare} className="me-2" /> Edit page copy
              </Button>
            )}
          </div>
        )}

        <Row className="g-4">
          <Col md={8}>
            <Card className="shadow-sm mb-4">
              <Card.Body>
                <Card.Title>About</Card.Title>
                <Card.Text>
                  {isEditing ? (
                    <RichTextMarkdownEditor
                      value={form?.aboutText ?? ''}
                      onChange={(md) => form && setForm({ ...form, aboutText: md })}
                      minHeight={120}
                    />
                  ) : (
                    <MarkdownViewer source={data?.aboutText} />
                  )}
                </Card.Text>
              </Card.Body>
            </Card>

            <Card className="shadow-sm mb-4">
              <Card.Body>
                <Card.Title>Programs</Card.Title>
                <Card.Text>
                  {isEditing ? (
                    <RichTextMarkdownEditor
                      value={form?.programsOverview ?? ''}
                      onChange={(md) => form && setForm({ ...form, programsOverview: md })}
                      minHeight={120}
                    />
                  ) : (
                    <MarkdownViewer source={data?.programsOverview} />
                  )}
                </Card.Text>
              </Card.Body>
            </Card>

            <Card className="shadow-sm mb-4">
              <Card.Body>
                <Card.Title>What to bring</Card.Title>
                <Card.Text>
                  {isEditing ? (
                    <RichTextMarkdownEditor
                      value={form?.whatToBringText ?? ''}
                      onChange={(md) => form && setForm({ ...form, whatToBringText: md })}
                      minHeight={120}
                    />
                  ) : (
                    <MarkdownViewer source={data?.whatToBringText} />
                  )}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="shadow-sm mb-3">
              <Card.Body>
                <Card.Title>Hours</Card.Title>
                <Card.Text>
                  {isEditing ? (
                    <RichTextMarkdownEditor
                      value={form?.hoursText ?? ''}
                      onChange={(md) => form && setForm({ ...form, hoursText: md })}
                      minHeight={80}
                    />
                  ) : (
                    <MarkdownViewer source={data?.hoursText} />
                  )}
                </Card.Text>
              </Card.Body>
            </Card>

            <Card className="shadow-sm mb-3">
              <Card.Body>
                <Card.Title>Location & Contact</Card.Title>
                <Card.Text>
                  {isEditing ? (
                    <>
                      <RichTextMarkdownEditor
                        value={form?.locationText ?? ''}
                        onChange={(md) => form && setForm({ ...form, locationText: md })}
                        minHeight={80}
                      />
                      <div className="mt-3">
                        <RichTextMarkdownEditor
                          value={form?.contactText ?? ''}
                          onChange={(md) => form && setForm({ ...form, contactText: md })}
                          minHeight={80}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <MarkdownViewer source={data?.locationText} />
                      <br />
                      <MarkdownViewer source={data?.contactText} />
                    </>
                  )}
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

      <ToastContainer position="bottom-end" className="p-3">
        {toast?.show && (
          <Toast bg={toast.variant} onClose={() => setToast(null)} show={toast.show} delay={3500} autohide>
            <Toast.Body className="text-white">{toast.message}</Toast.Body>
          </Toast>
        )}
      </ToastContainer>
    </div>
  )
}
