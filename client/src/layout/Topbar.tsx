import { useMemo } from 'react'
import Container from 'react-bootstrap/Container'
import Navbar from 'react-bootstrap/Navbar'
import Button from 'react-bootstrap/Button'
import Stack from 'react-bootstrap/Stack'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

function getTitle(pathname: string): string {
  if (pathname.startsWith('/clients')) return 'Clients'
  if (pathname.startsWith('/households')) return 'Households'
  if (pathname.startsWith('/applications')) return 'Applications'
  if (pathname.startsWith('/assistance')) return 'Assistance Log'
  if (pathname.startsWith('/users')) return 'Users'
  if (pathname.startsWith('/site-info')) return 'Site Info'
  if (pathname.startsWith('/reporting')) return 'Reporting'
  return 'Dashboard'
}

export function Topbar({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const title = useMemo(() => getTitle(pathname), [pathname])

  return (
    <Navbar bg="light" className="border-bottom d-print-none" expand={false}>
      <Container fluid className="gap-2">
        <Stack direction="horizontal" gap={2} className="align-items-center">
          {onToggleSidebar && (
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={onToggleSidebar}
              className="d-lg-none"
            >
              Menu
            </Button>
          )}
          <Navbar.Brand className="m-0">{title}</Navbar.Brand>
        </Stack>

        <Stack direction="horizontal" gap={2} className="ms-auto align-items-center">
          {user ? (
            <>
              <Button size="sm" variant="outline-primary" className="rounded-pill" onClick={() => navigate('/')}>Info</Button>
              <Button size="sm" variant="primary" className="ms-2" onClick={() => navigate('/dashboard')}>Dashboard</Button>
              <Button size="sm" variant="primary" onClick={() => navigate('/clients/new')}>
                Add Client
              </Button>
              <Button size="sm" variant="primary" onClick={() => navigate('/applications/new')}>
                Add Application
              </Button>

              <Button variant="link" size="sm" className="text-muted small ms-2 p-0" onClick={() => navigate('/users?editSelf=1')}>
                {user?.displayName}
              </Button>
              <Button variant="outline-secondary" size="sm" onClick={() => void logout()}>
                Logout
              </Button>
            </>
          ) : (
            <Button variant="primary" size="sm" onClick={() => navigate('/login')}>Login</Button>
          )}
        </Stack>
      </Container>
    </Navbar>
  )
}
