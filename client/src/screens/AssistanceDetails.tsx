import { useMemo } from 'react'
import Container from 'react-bootstrap/Container'
import Alert from 'react-bootstrap/Alert'
import Button from 'react-bootstrap/Button'
import Stack from 'react-bootstrap/Stack'
import Card from 'react-bootstrap/Card'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Badge from 'react-bootstrap/Badge'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAssistanceDetails } from '../hooks/useAssistanceDetails'
import { useAssistanceMutations } from '../hooks/useAssistanceMutations'

function formatMoney(value: number | null | undefined) {
  if (value == null) return '—'
  return value.toLocaleString(undefined, { style: 'currency', currency: 'USD' })
}

function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return '—'
  const d = typeof value === 'string' ? new Date(value) : value
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function ValueOrDash({ value }: { value: React.ReactNode }) {
  return value ? <>{value}</> : <span className="text-muted">—</span>
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="d-flex justify-content-between gap-3 py-2 border-bottom">
      <div className="text-muted small">{label}</div>
      <div className="text-end">{value ?? <span className="text-muted">—</span>}</div>
    </div>
  )
}

export function AssistanceDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, error } = useAssistanceDetails(id)
  const { remove } = useAssistanceMutations()

  const occurredLabel = useMemo(() => (data ? formatDateTime(data.occurredAt) : '—'), [data])

  if (isLoading) {
    return (
      <Container className="py-3">
        <div>Loading…</div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="py-3">
        <Alert variant="danger">Unable to load assistance event.</Alert>
      </Container>
    )
  }

  if (!data) {
    return (
      <Container className="py-3">
        <Alert variant="warning">Not found.</Alert>
      </Container>
    )
  }

  const isFoodPantry = data.programType?.toLowerCase().includes('food')
  const hasItems = data.items?.length > 0

  return (
    <Container className="py-3">
      {/* Header */}
      <Stack direction="horizontal" className="mb-3 align-items-start" gap={2}>
        <div className="me-auto">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <h1 className="h4 mb-0">{data.programType} assistance</h1>

            {data.billType ? (
              <Badge bg="secondary" className="fw-normal">
                {data.billType}
              </Badge>
            ) : null}

            {data.checkNumber ? (
              <Badge bg="light" text="dark" className="fw-normal border">
                Check #{data.checkNumber}
              </Badge>
            ) : null}
          </div>

          <div className="text-muted">{occurredLabel}</div>

          {/* One “headline” metric */}
          <div className="mt-2">
            {isFoodPantry ? (
              <div className="fw-semibold">
                <span className="text-muted me-2">Items:</span>
                {hasItems ? data.items.length : '—'}
              </div>
            ) : (
              <div className="fw-semibold">
                <span className="text-muted me-2">Amount paid:</span>
                {formatMoney(data.amountPaid)}
              </div>
            )}
          </div>
        </div>

        <Stack direction="horizontal" gap={2} className="flex-wrap">
          <Button size="sm" variant="outline-secondary" onClick={() => navigate(-1)}>
            Back
          </Button>
          <Button
            size="sm"
            variant="outline-danger"
            onClick={() => {
              if (!data) return
              // confirmation
              // eslint-disable-next-line no-restricted-globals
              if (!confirm('Delete this assistance event? This cannot be undone.')) return
              remove.mutate(data.id, {
                onSuccess: () => navigate('/assistance'),
              })
            }}
          >
            Delete
          </Button>
        </Stack>
      </Stack>

      <Row className="g-3">
        {/* Left column: Assistance details */}
        <Col xs={12} lg={7}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 pb-0">
              <div className="fw-semibold">Assistance details</div>
            </Card.Header>
            <Card.Body className="pt-2">
              {isFoodPantry ? (
                <>
                  <DetailRow label="Clients helped" value={<ValueOrDash value={data.householdMemberCount ?? '—'} />} />
                  <DetailRow label="Notes" value={<ValueOrDash value={data.notes ?? '—'} />} />
                </>
              ) : (
                <>
                  <DetailRow label="Bill / Item" value={<ValueOrDash value={data.billType ?? '—'} />} />
                  <DetailRow label="Amount paid" value={<span className="fw-semibold">{formatMoney(data.amountPaid)}</span>} />
                  <DetailRow label="Check #" value={<ValueOrDash value={data.checkNumber ?? '—'} />} />
                </>
              )}
            </Card.Body>
          </Card>

          {/* Items (only for Food Pantry) */}
          {isFoodPantry ? (
            <Card className="border-0 shadow-sm mt-3">
              <Card.Header className="bg-white border-0 pb-0">
                <div className="fw-semibold">Items dispensed</div>
              </Card.Header>
              <Card.Body className="pt-2">
                {hasItems ? (
                  <Stack direction="horizontal" gap={2} className="flex-wrap">
                    {data.items.map((i: any, idx: number) => (
                      <Badge key={`${i.itemType}-${i.id ?? idx}`} bg="light" text="dark" className="border fw-normal">
                        {i.itemType}
                        {i.quantity ? ` (${i.quantity})` : ''}
                      </Badge>
                    ))}
                  </Stack>
                ) : (
                  <div className="text-muted">—</div>
                )}
              </Card.Body>
            </Card>
          ) : null}
        </Col>

        {/* Right column: Household & person */}
        <Col xs={12} lg={5}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 pb-0">
              <div className="fw-semibold">Household</div>
            </Card.Header>
            <Card.Body className="pt-2">
              <div className="fw-semibold">
                <Link to={`/households/${data.householdId}`} className="text-decoration-none">
                  {data.street1}
                </Link>
              </div>
              <div className="text-muted">
                {data.city}, {data.state} {data.zip ?? ''}
              </div>
              {data.applicationId ? (
                <div className="mt-2">
                  <div className="text-muted small">Linked application</div>
                  <Link to={`/applications/${data.applicationId}`}>{data.applicationId}</Link>
                </div>
              ) : null}
              <div className="mt-3">
                <div className="text-muted small">Person</div>
                <div className="fw-semibold">{data.clientName ?? '—'}</div>
              </div>
            </Card.Body>
          </Card>

          {/* Notes + Audit */}
          <Card className="border-0 shadow-sm mt-3">
            <Card.Header className="bg-white border-0 pb-0">
              <div className="fw-semibold">Notes</div>
            </Card.Header>
            <Card.Body className="pt-2">
              {data.notes ? <div style={{ whiteSpace: 'pre-wrap' }}>{data.notes}</div> : <div className="text-muted">—</div>}
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm mt-3">
            <Card.Header className="bg-white border-0 pb-0">
              <div className="fw-semibold">Audit</div>
            </Card.Header>
            <Card.Body className="pt-2">
              <DetailRow label="Recorded by" value={<ValueOrDash value={data.recordedByUserDisplayName ?? '—'} />} />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}
