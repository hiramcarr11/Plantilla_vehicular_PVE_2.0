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
import { DirectorPage } from './pages/director-page';
import { APP_ROUTES, LEGACY_ROUTE_REDIRECTS } from './lib/routes';

export function App() {
  return (
    <Routes>
      <Route path={APP_ROUTES.access} element={<LoginPage />} />
      <Route
        path={APP_ROUTES.home}
        element={
          <ProtectedRoute
            allowedRoles={['capturist', 'regional_manager', 'admin', 'director', 'superadmin']}
          >
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomePage />} />
        <Route
          path={APP_ROUTES.workspace.slice(1)}
          element={
            <ProtectedRoute allowedRoles={['capturist']}>
              <CapturistPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={APP_ROUTES.archive.slice(1)}
          element={
            <ProtectedRoute allowedRoles={['capturist']}>
              <CapturistRecordsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={APP_ROUTES.monitor.slice(1)}
          element={
            <ProtectedRoute allowedRoles={['regional_manager']}>
              <RegionalPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={APP_ROUTES.overview.slice(1)}
          element={
            <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={APP_ROUTES.control.slice(1)}
          element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <SuperAdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={APP_ROUTES.insights.slice(1)}
          element={
            <ProtectedRoute allowedRoles={['director', 'admin', 'superadmin']}>
              <DirectorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={APP_ROUTES.controlActivity.slice(1)}
          element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <SuperAdminAuditPage />
            </ProtectedRoute>
          }
        />
      </Route>
      {LEGACY_ROUTE_REDIRECTS.map((redirect) => (
        <Route
          key={redirect.from}
          path={redirect.from}
          element={<Navigate to={redirect.to} replace />}
        />
      ))}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
