import Nav from 'react-bootstrap/Nav'
import Button from 'react-bootstrap/Button'
import Stack from 'react-bootstrap/Stack'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { logout } = useAuth()

  return (
    <div className="border-end h-100" style={{ width: 240 }}>
      <Stack gap={2} className="p-3">
        <div className="fw-semibold">Helping Hands</div>

        <Nav className="flex-column" variant="pills">
          <Nav.Link as={NavLink} to="/dashboard" onClick={onNavigate} end>
            Dashboard
          </Nav.Link>
          <Nav.Link as={NavLink} to="/clients" onClick={onNavigate}>
            Clients
          </Nav.Link>
          <Nav.Link as={NavLink} to="/households" onClick={onNavigate}>
            Households
          </Nav.Link>
          <Nav.Link as={NavLink} to="/applications" onClick={onNavigate}>
            Applications
          </Nav.Link>
          <Nav.Link as={NavLink} to="/assistance" onClick={onNavigate}>
            Assistance Log
          </Nav.Link>
          <Nav.Link as={NavLink} to="/users" onClick={onNavigate}>
            Users
          </Nav.Link>
          <Nav.Link as={NavLink} to="/site-info" onClick={onNavigate}>
            Site Info
          </Nav.Link>
          <Nav.Link as={NavLink} to="/reporting" onClick={onNavigate}>
            Reporting
          </Nav.Link>
        </Nav>

        <div className="pt-2 border-top">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => void logout()}
            className="w-100"
          >
            Logout
          </Button>
        </div>
      </Stack>
    </div>
  )
}
