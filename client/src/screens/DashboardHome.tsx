import Card from 'react-bootstrap/Card'
import Col from 'react-bootstrap/Col'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Spinner from 'react-bootstrap/Spinner'
import Alert from 'react-bootstrap/Alert'
import ListGroup from 'react-bootstrap/ListGroup'
import Button from 'react-bootstrap/Button'
import { useDashboardSummary } from '../hooks/useDashboardSummary'

export function DashboardHome() {
  const { data, isLoading, error } = useDashboardSummary()

  const dateRange = data ? `From ${data.from} to ${data.to}` : ''

  return (
    <Container className="py-3">
      <div className="d-flex align-items-center mb-1">
        <h1 className="h4 mb-0">Dashboard</h1>
        <Button
          variant="outline-secondary"
          size="sm"
          className="ms-auto d-print-none"
          onClick={() => window.print()}
        >
          Print
        </Button>
      </div>
      <div className="text-muted small mb-3">Monthly snapshot. {dateRange}</div>
      {isLoading ? (
        <Spinner animation="border" size="sm" />
      ) : error ? (
        <Alert variant="danger">Unable to load dashboard summary.</Alert>
      ) : data ? (
        <>
          <Row xs={1} md={3} className="g-3">
            <SummaryCard title="Households served" value={data.householdsServed} description="Unique households" />
            <SummaryCard title="Clients served" value={data.clientsServed} description="Unique clients" />
            <SummaryCard
              title="Assistance paid"
              value={`$${data.assistancePaidTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              description="Helping Hands"
            />
            <SummaryCard
              title="Applications"
              value={Object.values(data.applicationsByStatus).reduce((sum, v) => sum + v, 0)}
              description="Total in range"
            />
          </Row>

          <Row xs={1} md={2} className="g-3 mt-1">
            <Col>
              <Card>
                <Card.Body>
                  <Card.Title className="h6">Pantry item totals</Card.Title>
                  <ListGroup variant="flush" className="small">
                    {Object.keys(data.pantryItemTotals).length === 0 ? (
                      <ListGroup.Item className="text-muted">No pantry distributions in range.</ListGroup.Item>
                    ) : (
                      Object.entries(data.pantryItemTotals).map(([item, total]) => (
                        <ListGroup.Item key={item} className="d-flex justify-content-between">
                          <span>{item}</span>
                          <span>{total}</span>
                        </ListGroup.Item>
                      ))
                    )}
                  </ListGroup>
                </Card.Body>
              </Card>
            </Col>
            <Col>
              <Card>
                <Card.Body>
                  <Card.Title className="h6">Assistance by bill type</Card.Title>
                  <ListGroup variant="flush" className="small">
                    {Object.keys(data.assistancePaidByBillType).length === 0 ? (
                      <ListGroup.Item className="text-muted">No payments recorded in range.</ListGroup.Item>
                    ) : (
                      Object.entries(data.assistancePaidByBillType).map(([billType, total]) => (
                        <ListGroup.Item key={billType} className="d-flex justify-content-between">
                          <span>{billType}</span>
                          <span>${total.toLocaleString()}</span>
                        </ListGroup.Item>
                      ))
                    )}
                  </ListGroup>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
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
