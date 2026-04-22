import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../modules/auth/auth-context';

const roleLabels = {
  capturist: 'Capturista',
  regional_manager: 'Encargado regional',
  admin: 'Administrador',
  superadmin: 'Superadministrador',
};

const pageTitles: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'Resumen operativo',
    description: 'Consulta tu espacio de trabajo y accede rápido a las acciones principales.',
  },
  '/captures': {
    title: 'Captura de delegación',
    description: 'Registra nuevos bienes vehiculares desde tu delegación.',
  },
  '/captures/history': {
    title: 'Todas mis capturas',
    description: 'Consulta el historial completo de capturas registradas por tu usuario.',
  },
  '/region': {
    title: 'Monitoreo regional',
    description: 'Sigue la actividad de las delegaciones asignadas en tiempo real.',
  },
  '/admin': {
    title: 'Vista administrativa',
    description: 'Observa la operación completa organizada por región y delegación.',
  },
  '/superadmin': {
    title: 'Usuarios',
    description: 'Administra accesos, perfiles y cobertura operativa del sistema.',
  },
  '/superadmin/audit': {
    title: 'Bitácora',
    description: 'Supervisa en tiempo real los movimientos críticos del sistema.',
  },
};

export function AppShell() {
  const { session, logout } = useAuth();
  const location = useLocation();

  if (!session) {
    return null;
  }

  const currentPage = pageTitles[location.pathname] ?? pageTitles['/'];

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
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
          <p className="sidebar-subtitle">{session.user.fullName}</p>
        </div>

        <div className="sidebar-session-card">
          <span className="sidebar-session-label">Cobertura</span>
          <strong>{session.user.region?.name ?? session.user.delegation?.name ?? 'General'}</strong>
          <span>{session.user.grade}</span>
        </div>

        <nav className="sidebar-filters nav-list">
          <NavLink end to="/">
            Inicio
          </NavLink>

          {session.user.role === 'capturist' && (
            <NavLink end to="/captures">
              Capturar
            </NavLink>
          )}
          {session.user.role === 'capturist' && (
            <NavLink to="/captures/history">Todas mis capturas</NavLink>
          )}

          {session.user.role === 'regional_manager' && (
            <NavLink end to="/region">
              Delegaciones
            </NavLink>
          )}

          {(session.user.role === 'admin' || session.user.role === 'superadmin') && (
            <NavLink end to="/admin">
              Vista general
            </NavLink>
          )}

          {session.user.role === 'superadmin' && (
            <NavLink end to="/superadmin">
              Usuarios
            </NavLink>
          )}
          {session.user.role === 'superadmin' && (
            <NavLink to="/superadmin/audit">Bitácora</NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <button className="secondary-button" type="button" onClick={logout}>
            Cerrar sesión
          </button>
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
