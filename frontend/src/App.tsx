import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/app-shell';
import { ProtectedRoute } from './components/protected-route';
import { HomePage } from './pages/home-page';
import { LoginPage } from './pages/login-page';
import { CapturistPage } from './pages/capturist-page';
import { CapturistRecordsPage } from './pages/capturist-records-page';
import { RegionalPage } from './pages/regional-page';
import { AdminPage } from './pages/admin-page';
import { SuperAdminPage } from './pages/superadmin-page';
import { SuperAdminAuditPage } from './pages/superadmin-audit-page';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute
            allowedRoles={['capturist', 'regional_manager', 'admin', 'superadmin']}
          >
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomePage />} />
        <Route
          path="captures"
          element={
            <ProtectedRoute allowedRoles={['capturist']}>
              <CapturistPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="captures/history"
          element={
            <ProtectedRoute allowedRoles={['capturist']}>
              <CapturistRecordsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="region"
          element={
            <ProtectedRoute allowedRoles={['regional_manager']}>
              <RegionalPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin"
          element={
            <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="superadmin"
          element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <SuperAdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="superadmin/audit"
          element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <SuperAdminAuditPage />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
