import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { formatUserName } from '../lib/format-user-name';
import { APP_ROUTES } from '../lib/routes';
import { useAuth } from '../modules/auth/auth-context';

const roleLabels = {
  capturist: 'Capturista',
  regional_manager: 'Encargado regional',
  admin: 'Administrador',
  director: 'Director',
  superadmin: 'Superadministrador',
};

const pageTitles: Record<string, { title: string; description: string }> = {
  [APP_ROUTES.home]: {
    title: 'Resumen operativo',
    description: 'Consulta tu espacio de trabajo y accede rápido a las acciones principales.',
  },
  [APP_ROUTES.workspace]: {
    title: 'Captura de delegación',
    description: 'Registra nuevos bienes vehiculares desde tu delegación.',
  },
  [APP_ROUTES.archive]: {
    title: 'Todas mis capturas',
    description: 'Consulta el historial completo de capturas registradas por tu usuario.',
  },
  [APP_ROUTES.monitor]: {
    title: 'Monitoreo regional',
    description: 'Sigue la actividad de las delegaciones asignadas en tiempo real.',
  },
  [APP_ROUTES.overview]: {
    title: 'Vista administrativa',
    description: 'Observa la operación completa organizada por región y delegación.',
  },
  [APP_ROUTES.insights]: {
    title: 'Dashboard directivo',
    description: 'Consulta KPIs globales y el desglose por región y delegación.',
  },
  [APP_ROUTES.insightsMap]: {
    title: 'Mapa directivo',
    description: 'Explora la distribución territorial de vehículos con filtros operativos.',
  },
  [APP_ROUTES.control]: {
    title: 'Usuarios',
    description: 'Administra accesos, perfiles y cobertura operativa del sistema.',
  },
  [APP_ROUTES.controlActivity]: {
    title: 'Bitácora',
    description: 'Supervisa en tiempo real los movimientos críticos del sistema.',
  },
};

export function AppShell() {
  const { session, logoutWithApi } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!session) {
    return null;
  }

  const currentPage = pageTitles[location.pathname] ?? pageTitles[APP_ROUTES.home];

  return (
    <div className="dashboard-shell">
      <aside
        className={`sidebar ${isSidebarOpen ? 'is-open' : 'is-collapsed'}`}
        onMouseEnter={() => setIsSidebarOpen(true)}
        onMouseLeave={() => setIsSidebarOpen(false)}
        onFocusCapture={() => setIsSidebarOpen(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setIsSidebarOpen(false);
          }
        }}
      >
        <button
          aria-expanded={isSidebarOpen}
          aria-label={isSidebarOpen ? 'Ocultar navegación' : 'Mostrar navegación'}
          className="sidebar-toggle"
          type="button"
          onClick={() => setIsSidebarOpen((current) => !current)}
        >
          <span />
          <span />
          <span />
        </button>

        <div className="sidebar-panel">
          <div className="sidebar-logo-wrap">
            <img
              className="sidebar-logo"
              src="/policia-vial-estatal-oaxaca-seeklogo.png"
              alt="Logotipo institucional"
            />
          </div>

          <div className="sidebar-title-wrap">
            <p className="eyebrow">Sistema vehicular</p>
            <h1 className="sidebar-title">{roleLabels[session.user.role]}</h1>
            <p className="sidebar-subtitle">{formatUserName(session.user)}</p>
          </div>

          <div className="sidebar-session-card">
            <span className="sidebar-session-label">Cobertura</span>
            <strong>{session.user.region?.name ?? session.user.delegation?.name ?? 'General'}</strong>
            <span>{session.user.grade}</span>
          </div>

          <nav className="sidebar-filters nav-list">
            <NavLink end to={APP_ROUTES.home}>
              Inicio
            </NavLink>

            {session.user.role === 'capturist' && (
              <NavLink end to={APP_ROUTES.workspace}>
                Capturar
              </NavLink>
            )}
            {session.user.role === 'capturist' && (
              <NavLink to={APP_ROUTES.archive}>Todas mis capturas</NavLink>
            )}

            {session.user.role === 'regional_manager' && (
              <NavLink end to={APP_ROUTES.monitor}>
                Delegaciones
              </NavLink>
            )}

            {(session.user.role === 'admin' || session.user.role === 'superadmin') && (
              <NavLink end to={APP_ROUTES.overview}>
                Vista general
              </NavLink>
            )}

            {(session.user.role === 'director' ||
              session.user.role === 'admin' ||
              session.user.role === 'superadmin') && (
              <NavLink end to={APP_ROUTES.insights}>
                Dashboard directivo
              </NavLink>
            )}

            {(session.user.role === 'director' ||
              session.user.role === 'admin' ||
              session.user.role === 'superadmin') && (
              <NavLink end to={APP_ROUTES.insightsMap}>
                Mapa directivo
              </NavLink>
            )}

            {session.user.role === 'superadmin' && (
              <NavLink end to={APP_ROUTES.control}>
                Usuarios
              </NavLink>
            )}
            {session.user.role === 'superadmin' && (
              <NavLink to={APP_ROUTES.controlActivity}>Bitácora</NavLink>
            )}
          </nav>

          <div className="sidebar-footer">
            <button className="secondary-button" type="button" onClick={logoutWithApi}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      <main className="main-stage">
        <header className="main-header">
          <div className="page-title-block">
            <h1>{currentPage.title}</h1>
            <p>{currentPage.description}</p>
          </div>
          <div className="header-actions">
            <div className="live-pill">
              <span className="live-dot" />
              Sesión activa
            </div>
          </div>
        </header>

        <section className="content-section">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
