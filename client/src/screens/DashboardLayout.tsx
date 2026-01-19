import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import Container from 'react-bootstrap/Container'
import Offcanvas from 'react-bootstrap/Offcanvas'
import { Sidebar } from '../layout/Sidebar'
import { Topbar } from '../layout/Topbar'

export function DashboardLayout() {
  const [showSidebar, setShowSidebar] = useState(false)

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      <div className="d-none d-lg-block d-print-none">
        <Sidebar />
      </div>

      <div className="flex-grow-1">
        <Topbar onToggleSidebar={() => setShowSidebar(true)} />
        <Container fluid className="py-3">
          <Outlet />
        </Container>
      </div>

      <Offcanvas
        show={showSidebar}
        onHide={() => setShowSidebar(false)}
        placement="start"
        className="d-print-none"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">
          <Sidebar onNavigate={() => setShowSidebar(false)} />
        </Offcanvas.Body>
      </Offcanvas>
    </div>
  )
}
