import Container from 'react-bootstrap/Container'

export function NotFound() {
  return (
    <Container className="py-3">
      <h1 className="h3 mb-3">Not Found</h1>
      <div>The page you requested does not exist.</div>
    </Container>
  )
}
