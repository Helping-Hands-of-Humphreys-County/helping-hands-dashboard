import Container from 'react-bootstrap/Container'

export function ComingSoon({ title }: { title: string }) {
  return (
    <Container className="py-3">
      <h1 className="h3 mb-3">{title}</h1>
      <div>Coming soon.</div>
    </Container>
  )
}
