import { useMemo, useState } from 'react'
import Container from 'react-bootstrap/Container'
import Form from 'react-bootstrap/Form'
import Table from 'react-bootstrap/Table'
import Alert from 'react-bootstrap/Alert'
import Spinner from 'react-bootstrap/Spinner'
import Stack from 'react-bootstrap/Stack'
import Button from 'react-bootstrap/Button'
import Badge from 'react-bootstrap/Badge'
import Card from 'react-bootstrap/Card'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import { useAssistanceReport } from '../hooks/useAssistanceReport'

export function Reporting() {
  const today = useMemo(() => new Date(), [])
  const startOfYear = useMemo(() => `${today.getFullYear()}-01-01`, [today])
  const todayIso = useMemo(() => today.toISOString().slice(0, 10), [today])
  const [program, setProgram] = useState('Both')
  const [from, setFrom] = useState(startOfYear)
  const [to, setTo] = useState(todayIso)

  const { data, isLoading, error, refetch } = useAssistanceReport({ program, from, to })

  return (
    <Container className="py-3">
      <h1 className="h4 mb-3">Reporting</h1>

      <Form
        onSubmit={(e) => {
          e.preventDefault()
          refetch()
        }}
        className="mb-3 d-print-none"
      >
        <Stack direction="horizontal" gap={3} className="flex-wrap">
          <Form.Group controlId="program" style={{ minWidth: 160 }}>
            <Form.Label>Program</Form.Label>
            <Form.Select value={program} onChange={(e) => setProgram(e.target.value)}>
              <option value="FoodPantry">Food Pantry</option>
              <option value="HelpingHands">Helping Hands</option>
              <option value="Both">Both</option>
            </Form.Select>
          </Form.Group>
          <Form.Group controlId="from">
            <Form.Label>From</Form.Label>
            <Form.Control type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Form.Group>
          <Form.Group controlId="to">
            <Form.Label>To</Form.Label>
            <Form.Control type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Form.Group>
          <div className="d-flex align-items-end gap-2">
            <Button type="submit">Run</Button>
            <Button variant="outline-secondary" onClick={() => window.print()}>
              Print
            </Button>
          </div>
        </Stack>
      </Form>

      {isLoading ? (
        <Spinner animation="border" size="sm" />
      ) : error ? (
        <Alert variant="danger">Unable to load report.</Alert>
      ) : data ? (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <div className="fw-semibold">{data.summary.program} report</div>
              <div className="text-muted small">
                {data.summary.from} – {data.summary.to}
              </div>
              <div className="text-muted small">Generated at {new Date(data.generatedAt).toLocaleString()}</div>
            </div>
          </div>

          <Row xs={1} md={3} className="g-3 mb-3">
            <SummaryCard title="Events" value={data.summary.totalEvents} description="Assistance events" />
            <SummaryCard title="Households" value={data.summary.uniqueHouseholds} description="Served in range" />
            <SummaryCard title="Clients" value={data.summary.uniqueClients} description="Served in range" />
            <SummaryCard
              title="Assistance paid"
              value={`$${data.summary.assistancePaidTotal.toLocaleString()}`}
              description="Helping Hands"
            />
          </Row>

          <Row xs={1} md={2} className="g-3 mb-4">
            <Col>
              <Card>
                <Card.Body>
                  <Card.Title className="h6">Pantry item totals</Card.Title>
                  {Object.keys(data.summary.pantryItemTotals).length === 0 ? (
                    <div className="text-muted small">No pantry items in range.</div>
                  ) : (
                    <ul className="small mb-0">
                      {Object.entries(data.summary.pantryItemTotals).map(([item, total]) => (
                        <li key={item} className="d-flex justify-content-between">
                          <span>{item}</span>
                          <span>{total}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card.Body>
              </Card>
            </Col>
            <Col>
              <Card>
                <Card.Body>
                  <Card.Title className="h6">Assistance by bill type</Card.Title>
                  {Object.keys(data.summary.assistancePaidByBillType).length === 0 ? (
                    <div className="text-muted small">No payments recorded.</div>
                  ) : (
                    <ul className="small mb-0">
                      {Object.entries(data.summary.assistancePaidByBillType).map(([bill, total]) => (
                        <li key={bill} className="d-flex justify-content-between">
                          <span>{bill}</span>
                          <span>${total.toLocaleString()}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Table bordered striped responsive size="sm">
            <thead>
              <tr>
                <th>Date</th>
                <th>Program</th>
                <th>Address</th>
                <th>Clients</th>
                <th>Bill / Items</th>
                <th>Amount paid</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {data.details.map((row) => {
                const itemsText = row.items.length
                  ? row.items.map((i) => `${i.itemType} x${i.quantity}`).join(', ')
                  : null

                return (
                  <tr key={row.id}>
                    <td className="text-nowrap">{new Date(row.occurredAt).toLocaleDateString()}</td>
                    <td className="text-nowrap">{row.programType}</td>
                    <td>
                      <div className="fw-semibold">{row.street1}</div>
                      <div className="text-muted small">
                        {row.city}, {row.state} {row.zip ?? ''}
                      </div>
                    </td>
                    <td>{(row.clientNames && row.clientNames.length > 0) ? row.clientNames.join(', ') : (row.clientName ?? '—')}</td>
                    <td>
                      {row.billType ? <Badge bg="secondary" className="me-1">{row.billType}</Badge> : null}
                      {itemsText ?? '—'}
                    </td>
                    <td className="text-nowrap">{row.amountPaid != null ? `$${row.amountPaid.toLocaleString()}` : '—'}</td>
                    <td className="text-muted small">{row.notes ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </div>
      ) : null}
    </Container>
  )
}

function SummaryCard({ title, value, description }: { title: string; value: number | string; description: string }) {
  return (
    <Col>
      <Card>
        <Card.Body>
          <Card.Title className="mb-1">{title}</Card.Title>
          <div className="display-6">{value}</div>
          <div className="text-muted small">{description}</div>
        </Card.Body>
      </Card>
    </Col>
  )
}