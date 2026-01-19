import Container from 'react-bootstrap/Container'
import Table from 'react-bootstrap/Table'
import Alert from 'react-bootstrap/Alert'
import Button from 'react-bootstrap/Button'
import Stack from 'react-bootstrap/Stack'
import ListGroup from 'react-bootstrap/ListGroup'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useHouseholdDetails } from '../hooks/useHouseholdDetails'

export function HouseholdDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, error } = useHouseholdDetails(id)

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
        <Alert variant="danger">Unable to load household.</Alert>
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

  return (
    <Container className="py-3">
      <Stack direction="horizontal" gap={2} className="mb-3 flex-wrap align-items-center">
        <div className="fw-semibold fs-5 mb-0">Household</div>
        <div className="text-muted small">{data.street1}, {data.city}, {data.state} {data.zip ?? ''}</div>
        <Button size="sm" variant="outline-primary" onClick={() => navigate(`/households/${data.id}/edit`)}>
          Edit
        </Button>
      </Stack>

      <Table bordered striped size="sm" responsive>
        <tbody>
          <tr>
            <th style={{ width: '200px' }}>Address</th>
            <td>
              <div>{data.street1}</div>
              {data.street2 ? <div>{data.street2}</div> : null}
              <div className="text-muted small">{data.city}, {data.state} {data.zip ?? ''}</div>
            </td>
          </tr>
          <tr>
            <th>Members</th>
            <td>
              {data.members.length === 0 ? 'No members' : (
                <ListGroup variant="flush">
                  {data.members.map((m) => (
                    <ListGroup.Item key={m.id} className="px-0">
                      <div className="fw-semibold">
                        <Link to={`/clients/${m.id}`}>{m.firstName} {m.lastName}</Link>
                      </div>
                      <div className="text-muted small">
                        {m.dob ? `DOB ${m.dob}` : 'DOB unknown'}
                        {m.phone ? ` · ${m.phone}` : ''}
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </td>
          </tr>
        </tbody>
      </Table>

      <div className="mt-4">
        <div className="fw-semibold mb-2">Recent assistance</div>
        {data.recentAssistance.length === 0 ? (
          <Alert variant="light" className="text-muted">No assistance recorded.</Alert>
        ) : (
          <Table bordered striped size="sm" responsive>
            <thead>
              <tr>
                <th>Date</th>
                <th>Program</th>
                <th>Bill/Item</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.recentAssistance.map((a) => (
                <tr key={a.id} role="button" style={{ cursor: 'pointer' }} onClick={() => navigate(`/applications/${a.applicationId ?? a.householdId}#assist=${a.id}`)}>
                  <td>{new Date(a.occurredAt).toLocaleDateString()}</td>
                  <td>{a.programType}</td>
                  <td>{a.billType ?? a.notes ?? '—'}</td>
                  <td>{a.amountPaid != null ? `$${a.amountPaid.toLocaleString()}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </Container>
  )
}
