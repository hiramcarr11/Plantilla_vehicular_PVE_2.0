import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/app-shell';
import { LoadingSpinner } from './components/loading-spinner';
import { ProtectedRoute } from './components/protected-route';
import { LoginPage } from './pages/login-page';
import { APP_ROUTES, LEGACY_ROUTE_REDIRECTS } from './lib/routes';

const HomePage = lazy(() => import('./pages/home-page').then((m) => ({ default: m.HomePage })));
const CapturistPage = lazy(() => import('./pages/capturist-page').then((m) => ({ default: m.CapturistPage })));
const CapturistRecordsPage = lazy(() => import('./pages/capturist-records-page').then((m) => ({ default: m.CapturistRecordsPage })));
const RegionalPage = lazy(() => import('./pages/regional-page').then((m) => ({ default: m.RegionalPage })));
const AdminPage = lazy(() => import('./pages/admin-page').then((m) => ({ default: m.AdminPage })));
const SuperAdminPage = lazy(() => import('./pages/superadmin-page').then((m) => ({ default: m.SuperAdminPage })));
const SuperAdminAuditPage = lazy(() => import('./pages/superadmin-audit-page').then((m) => ({ default: m.SuperAdminAuditPage })));
const DirectorPage = lazy(() => import('./pages/director-page').then((m) => ({ default: m.DirectorPage })));
const DirectorMapPage = lazy(() => import('./pages/director-map-page').then((m) => ({ default: m.DirectorMapPage })));

function LazyPage({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<LoadingSpinner message="Cargando secci&oacute;n..." />}>
      {children}
    </Suspense>
  );
}

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
        <Route index element={<LazyPage><HomePage /></LazyPage>} />
        <Route
          path={APP_ROUTES.workspace.slice(1)}
          element={
            <ProtectedRoute allowedRoles={['capturist']}>
              <LazyPage><CapturistPage /></LazyPage>
            </ProtectedRoute>
          }
        />
        <Route
          path={APP_ROUTES.archive.slice(1)}
          element={
            <ProtectedRoute allowedRoles={['capturist']}>
              <LazyPage><CapturistRecordsPage /></LazyPage>
            </ProtectedRoute>
          }
        />
        <Route
          path={APP_ROUTES.monitor.slice(1)}
          element={
            <ProtectedRoute allowedRoles={['regional_manager']}>
              <LazyPage><RegionalPage /></LazyPage>
            </ProtectedRoute>
          }
        />
        <Route
          path={APP_ROUTES.overview.slice(1)}
          element={
            <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
              <LazyPage><AdminPage /></LazyPage>
            </ProtectedRoute>
          }
        />
        <Route
          path={APP_ROUTES.control.slice(1)}
          element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <LazyPage><SuperAdminPage /></LazyPage>
            </ProtectedRoute>
          }
        />
        <Route
          path={APP_ROUTES.insights.slice(1)}
          element={
            <ProtectedRoute allowedRoles={['director', 'admin', 'superadmin']}>
              <LazyPage><DirectorPage /></LazyPage>
            </ProtectedRoute>
          }
        />
        <Route
          path={APP_ROUTES.insightsMap.slice(1)}
          element={
            <ProtectedRoute allowedRoles={['director', 'admin', 'superadmin']}>
              <LazyPage><DirectorMapPage /></LazyPage>
            </ProtectedRoute>
          }
        />
        <Route
          path={APP_ROUTES.controlActivity.slice(1)}
          element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <LazyPage><SuperAdminAuditPage /></LazyPage>
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
