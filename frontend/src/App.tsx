import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/app-shell';
import { ProtectedRoute } from './components/protected-route';
import { HomePage } from './pages/home-page';
import { LoginPage } from './pages/login-page';
import { EnlacePage } from './pages/enlace-page';
import { EnlaceRecordsPage } from './pages/enlace-records-page';
import { PlantillaVehicularPage } from './pages/plantilla-vehicular-page';
import { CoordinacionPage } from './pages/coordinacion-page';
import { CoordinacionAuditPage } from './pages/coordinacion-audit-page';
import { DirectorGeneralPage } from './pages/director-general-page';
import { DirectorGeneralMapPage } from './pages/director-general-map-page';
import { DirectorOperativoPage } from './pages/director-operativo-page';
import { APP_ROUTES, LEGACY_ROUTE_REDIRECTS } from './lib/routes';

export function App() {
  return (
    <Routes>
      <Route path={APP_ROUTES.access} element={<LoginPage />} />
      <Route
        path={APP_ROUTES.home}
        element={
          <ProtectedRoute
            allowedRoles={['enlace', 'director_operativo', 'plantilla_vehicular', 'director_general', 'superadmin', 'coordinacion']}
          >
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomePage />} />
        <Route
          path={APP_ROUTES.workspace.slice(1)}
          element={
            <ProtectedRoute allowedRoles={['enlace']}>
              <EnlacePage />
            </ProtectedRoute>
          }
        />
        <Route
          path={APP_ROUTES.archive.slice(1)}
          element={
            <ProtectedRoute allowedRoles={['enlace']}>
              <EnlaceRecordsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={APP_ROUTES.monitor.slice(1)}
          element={
            <ProtectedRoute allowedRoles={['director_operativo']}>
              <DirectorOperativoPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={APP_ROUTES.overview.slice(1)}
          element={
            <ProtectedRoute allowedRoles={['plantilla_vehicular', 'superadmin', 'coordinacion', 'director_operativo']}>
              <PlantillaVehicularPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={APP_ROUTES.control.slice(1)}
          element={
            <ProtectedRoute allowedRoles={['superadmin', 'coordinacion']}>
              <CoordinacionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={APP_ROUTES.insights.slice(1)}
          element={
            <ProtectedRoute allowedRoles={['director_general', 'plantilla_vehicular', 'superadmin', 'coordinacion', 'director_operativo']}>
              <DirectorGeneralPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={APP_ROUTES.insightsMap.slice(1)}
          element={
            <ProtectedRoute allowedRoles={['director_general', 'plantilla_vehicular', 'superadmin', 'coordinacion', 'director_operativo']}>
              <DirectorGeneralMapPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={APP_ROUTES.controlActivity.slice(1)}
          element={
            <ProtectedRoute allowedRoles={['superadmin', 'coordinacion']}>
              <CoordinacionAuditPage />
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
