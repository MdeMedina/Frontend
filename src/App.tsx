import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { NavigateToRoleDashboard } from './components/NavigateToRoleDashboard';
import { Login } from './pages/Login';
import SetPassword from './pages/auth/SetPassword';
import { SelectResidence } from './pages/SelectResidence';
import { Profile } from './pages/Profile';
import { ControlPiso } from './pages/conserje/ControlPiso';
// Admin
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminBuildings } from './pages/admin/Buildings';
import { AdminApartments } from './pages/admin/Apartments';
import { AdminReservations } from './pages/admin/Reservations';
import { AdminUsers } from './pages/admin/Users';
import { AdminPetitions } from './pages/admin/Petitions';
import { AdminAuditLog } from './pages/admin/AuditLog';
import { AdminCalendar } from './pages/admin/Calendar';
// SuperAdmin
import { SuperAdminDashboard } from './pages/superadmin/Dashboard';
import Residences from './pages/superadmin/Residences';
import Administrators from './pages/superadmin/Administrators';
// Propietario
import { PropietarioDashboard } from './pages/propietario/Dashboard';
import { PropietarioApartments } from './pages/propietario/Apartments';
import { PropietarioManagers } from './pages/propietario/Managers';
import { PropietarioReservations } from './pages/propietario/Reservations';
import { PropietarioPetitions } from './pages/propietario/Petitions';
import { PropietarioCalendar } from './pages/propietario/Calendar';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/set-password/:token" element={<SetPassword />} />
          
          {/* Ruta raíz: redirige según el rol */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <NavigateToRoleDashboard />
              </ProtectedRoute>
            }
          />



          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/select-residence"
            element={
              <ProtectedRoute>
                <SelectResidence />
              </ProtectedRoute>
            }
          />

          {/* Rutas de Conserje */}
          <Route
            path="/conserje"
            element={
              <ProtectedRoute allowedRoles={['CONCIERGE']}>
                <ControlPiso />
              </ProtectedRoute>
            }
          />

          {/* Rutas de Propietario */}
          <Route
            path="/propietario"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <PropietarioDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/propietario/apartments"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <PropietarioApartments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/propietario/managers"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <PropietarioManagers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/propietario/reservations"
            element={
              <ProtectedRoute allowedRoles={['OWNER', 'ASSIGNED_MANAGER']}>
                <PropietarioReservations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/propietario/petitions"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <PropietarioPetitions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/propietario/calendar"
            element={
              <ProtectedRoute allowedRoles={['OWNER', 'ASSIGNED_MANAGER']}>
                <PropietarioCalendar />
              </ProtectedRoute>
            }
          />

          {/* Rutas de SuperAdmin */}
          <Route
            path="/superadmin"
            element={
              <ProtectedRoute allowedRoles={['SUPERADMIN']}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/residences"
            element={
              <ProtectedRoute allowedRoles={['SUPERADMIN']}>
                <Residences />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/administrators"
            element={
              <ProtectedRoute allowedRoles={['SUPERADMIN']}>
                <Administrators />
              </ProtectedRoute>
            }
          />

          {/* Rutas de Admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/buildings"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminBuildings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/apartments"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminApartments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reservations"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminReservations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/petitions"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminPetitions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminAuditLog />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/calendar"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminCalendar />
              </ProtectedRoute>
            }
          />

          {/* Rutas de Responsable (ASSIGNED_MANAGER) */}
          <Route
            path="/responsable"
            element={
              <ProtectedRoute allowedRoles={['ASSIGNED_MANAGER']}>
                <PropietarioDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/responsable/apartments"
            element={
              <ProtectedRoute allowedRoles={['ASSIGNED_MANAGER']}>
                <PropietarioApartments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/responsable/reservations"
            element={
              <ProtectedRoute allowedRoles={['ASSIGNED_MANAGER']}>
                <PropietarioReservations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/responsable/calendar"
            element={
              <ProtectedRoute allowedRoles={['ASSIGNED_MANAGER']}>
                <PropietarioCalendar />
              </ProtectedRoute>
            }
          />

          {/* Ruta 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
