import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { PublicHome } from '../screens/PublicHome'
import { Login } from '../screens/Login'
import { ForgotPassword } from '../screens/ForgotPassword'
import { ResetPassword } from '../screens/ResetPassword'
import { SetPassword } from '../screens/SetPassword'
import { DashboardLayout } from '../screens/DashboardLayout'
import { DashboardHome } from '../screens/DashboardHome'
import { NotFound } from '../screens/NotFound'
import { SiteInfoEditor } from '../screens/SiteInfoEditor'
import { ApplicationDetails } from '../screens/ApplicationDetails'
import { ClientDetails } from '../screens/ClientDetails'
import { HouseholdsList } from '../screens/HouseholdsList'
import { ClientsList } from '../screens/ClientsList'
import { ApplicationsList } from '../screens/ApplicationsList'
import { AssistanceLog } from '../screens/AssistanceLog'
import { Reporting } from '../screens/Reporting'
import { ClientForm } from '../screens/ClientForm'
import { HouseholdForm } from '../screens/HouseholdForm'
import { ApplicationForm } from '../screens/ApplicationForm'
import { AssistanceForm } from '../screens/AssistanceForm'
import { UsersList } from '../screens/UsersList'
import { AssistanceDetails } from '../screens/AssistanceDetails'
import { HouseholdDetails } from '../screens/HouseholdDetails'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicHome />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/set-password" element={<SetPassword />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardHome />} />

          <Route path="/clients" element={<ClientsList />} />
          <Route path="/clients/new" element={<ClientForm />} />
          <Route path="/clients/:id" element={<ClientDetails />} />
          <Route path="/clients/:id/edit" element={<ClientForm />} />

          <Route path="/households" element={<HouseholdsList />} />
          <Route path="/households/new" element={<HouseholdForm />} />
          <Route path="/households/:id" element={<HouseholdDetails />} />
          <Route path="/households/:id/edit" element={<HouseholdForm />} />

          <Route path="/applications" element={<ApplicationsList />} />
          <Route path="/applications/new" element={<ApplicationForm />} />
          <Route path="/applications/:id" element={<ApplicationDetails />} />
          <Route path="/applications/:id/edit" element={<ApplicationForm />} />

          <Route path="/assistance" element={<AssistanceLog />} />
          <Route path="/assistance/new" element={<AssistanceForm />} />
          <Route path="/assistance/:id" element={<AssistanceDetails />} />
          <Route path="/assistance/:id/edit" element={<AssistanceForm />} />

          <Route path="/users" element={<UsersList />} />
          <Route path="/site-info" element={<SiteInfoEditor />} />
          <Route path="/reporting" element={<Reporting />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
