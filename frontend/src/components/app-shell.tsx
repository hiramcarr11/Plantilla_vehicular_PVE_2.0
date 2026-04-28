import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { formatUserName } from '../lib/format-user-name';
import { APP_ROUTES } from '../lib/routes';
import { useAuth } from '../modules/auth/auth-context';
import { MessageNotification } from '../modules/messages/components/MessageNotification';
import { MessengerPanel } from '../modules/messages/components/MessengerPanel';
import { MESSENGER_ROLES, ROUTE_ROLES, hasAnyRole } from '../lib/role-access';

const roleLabels = {
  enlace: 'Enlace',
  director_operativo: 'Director Operativo',
  plantilla_vehicular: 'Admin Plantilla vehicular',
  director_general: 'Director General',
  superadmin: 'Superadministrador',
  coordinacion: 'Coordinación',
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
  const [isMessengerOpen, setIsMessengerOpen] = useState(false);

  if (!session) {
    return null;
  }

  const canUseMessenger = hasAnyRole(session.user.role, MESSENGER_ROLES);

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

            {hasAnyRole(session.user.role, ROUTE_ROLES.workspace) && (
              <NavLink end to={APP_ROUTES.workspace}>
                Capturar
              </NavLink>
            )}
            {hasAnyRole(session.user.role, ROUTE_ROLES.archive) && (
              <NavLink to={APP_ROUTES.archive}>Todas mis capturas</NavLink>
            )}

            {hasAnyRole(session.user.role, ROUTE_ROLES.monitor) && (
              <NavLink end to={APP_ROUTES.monitor}>
                Delegaciones
              </NavLink>
            )}

            {hasAnyRole(session.user.role, ROUTE_ROLES.overview) && (
              <NavLink end to={APP_ROUTES.overview}>
                Vista general
              </NavLink>
            )}

            {hasAnyRole(session.user.role, ROUTE_ROLES.insights) && (
              <NavLink end to={APP_ROUTES.insights}>
                Dashboard directivo
              </NavLink>
            )}

            {hasAnyRole(session.user.role, ROUTE_ROLES.insightsMap) && (
              <NavLink end to={APP_ROUTES.insightsMap}>
                Mapa directivo
              </NavLink>
            )}

            {hasAnyRole(session.user.role, ROUTE_ROLES.control) && (
              <NavLink end to={APP_ROUTES.control}>
                Usuarios
              </NavLink>
            )}
            {hasAnyRole(session.user.role, ROUTE_ROLES.controlActivity) && (
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
            {canUseMessenger && (
              <button
                className="messenger-toggle-btn"
                type="button"
                onClick={() => setIsMessengerOpen((prev) => !prev)}
                title="Mensajero"
              >
                Mensajes
              </button>
            )}
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

      {canUseMessenger && isMessengerOpen && (
        <div className="messenger-overlay" onClick={() => setIsMessengerOpen(false)}>
          <div className="messenger-float-panel" onClick={(e) => e.stopPropagation()}>
            <button
              className="messenger-close-btn"
              type="button"
              onClick={() => setIsMessengerOpen(false)}
            >
              ×
            </button>
            <MessengerPanel />
          </div>
        </div>
      )}

      {canUseMessenger && <MessageNotification />}
    </div>
  );
}
