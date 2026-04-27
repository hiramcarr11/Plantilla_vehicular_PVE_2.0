import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageIntro } from '../components/page-intro';
import { StatsGrid } from '../components/stats-grid';
import { api } from '../lib/api';
import { formatUserName } from '../lib/format-user-name';
import { APP_ROUTES } from '../lib/routes';
import { useAuth } from '../modules/auth/auth-context';
import type { VehicleRecord } from '../types';

const roleDescriptions = {
  enlace: 'Registra información de tu delegación y consulta tus propias capturas.',
  director_operativo: 'Monitorea en tiempo real las delegaciones asignadas a tu región.',
  plantilla_vehicular: 'Consulta la operación completa organizada por región y delegación.',
  director_general: 'Consulta KPIs globales y el comportamiento operativo por región y delegación.',
  superadmin: 'Administra usuarios y consulta la bitácora en tiempo real.',
  coordinacion: 'Administra usuarios y consulta la bitácora en tiempo real.',
};

const quickActions = {
  director_operativo: [
    { label: 'Ver delegaciones', to: APP_ROUTES.monitor, helper: 'Seguimiento en tiempo real' },
    { label: 'Abrir vista general', to: APP_ROUTES.overview, helper: 'Supervisión completa' },
    { label: 'Abrir dashboard director', to: APP_ROUTES.insights, helper: 'KPIs y desglose global' },
  ],
  plantilla_vehicular: [
    { label: 'Abrir vista general', to: APP_ROUTES.overview, helper: 'Supervisión completa' },
    { label: 'Abrir dashboard director', to: APP_ROUTES.insights, helper: 'KPIs y desglose global' },
  ],
  director_general: [
    { label: 'Abrir dashboard director', to: APP_ROUTES.insights, helper: 'KPIs y desglose global' },
  ],
  superadmin: [
    { label: 'Administrar usuarios', to: APP_ROUTES.control, helper: 'Altas y supervisión de actividad' },
    { label: 'Abrir vista general', to: APP_ROUTES.overview, helper: 'Panorama operativo' },
    { label: 'Abrir dashboard director', to: APP_ROUTES.insights, helper: 'KPIs y desglose global' },
  ],
  coordinacion: [
    { label: 'Administrar usuarios', to: APP_ROUTES.control, helper: 'Altas y supervisión de actividad' },
    { label: 'Abrir vista general', to: APP_ROUTES.overview, helper: 'Panorama operativo' },
    { label: 'Abrir dashboard director', to: APP_ROUTES.insights, helper: 'KPIs y desglose global' },
  ],
};

export function HomePage() {
  const { session } = useAuth();
  const [records, setRecords] = useState<VehicleRecord[]>([]);

  useEffect(() => {
    if (!session || session.user.role !== 'enlace') {
      return;
    }

    void api.getMyRecords(session.accessToken).then(setRecords);
  }, [session]);

  if (!session) {
    return null;
  }

  const latestRecord = records[0];
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthCaptures = useMemo(
    () =>
      records.filter((record) => {
        const createdAt = new Date(record.createdAt);
        return createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear;
      }).length,
    [currentMonth, currentYear, records],
  );

  const statusBreakdown = useMemo(() => {
    return records.reduce<Record<string, number>>((totals, record) => {
      totals[record.status] = (totals[record.status] ?? 0) + 1;
      return totals;
    }, {});
  }, [records]);

  const topStatus = Object.entries(statusBreakdown).sort((left, right) => right[1] - left[1])[0];
  const actions = session.user.role === 'enlace' ? [] : quickActions[session.user.role];

  return (
    <div className="stack-lg">
      <section className="panel">
        <PageIntro
          eyebrow="Bienvenido"
          title={formatUserName(session.user)}
          description={roleDescriptions[session.user.role]}
        />

        <StatsGrid
          items={[
            { label: 'Rol actual', value: session.user.role },
            { label: 'Grado', value: session.user.grade },
            { label: 'Región', value: session.user.region?.name ?? '-' },
            { label: 'Delegación', value: session.user.delegation?.name ?? '-' },
          ]}
        />
      </section>

      {session.user.role === 'enlace' ? (
        <section className="quick-grid">
          <article className="quick-card">
            <span className="quick-card-label">Capturas totales</span>
            <strong>{records.length}</strong>
            <p>Capturas totales registradas por tu usuario.</p>
          </article>
          <article className="quick-card">
            <span className="quick-card-label">Capturas del mes</span>
            <strong>{monthCaptures}</strong>
            <p>Capturas realizadas durante el mes actual.</p>
          </article>
          <article className="quick-card">
            <span className="quick-card-label">Última placa capturada</span>
            <strong>{latestRecord ? latestRecord.plates : '-'}</strong>
            <p>Última placa capturada en tu historial.</p>
          </article>
          <article className="quick-card">
            <span className="quick-card-label">Estatus dominante</span>
            <strong>{topStatus ? topStatus[0] : '-'}</strong>
            <p>{topStatus ? `${topStatus[1]} capturas con ese estatus.` : 'Sin capturas aún.'}</p>
          </article>
        </section>
      ) : (
        <section className="quick-grid">
          {actions.map((action) => (
            <Link className="quick-card" key={action.to} to={action.to}>
              <span className="quick-card-label">Acceso rápido</span>
              <strong>{action.label}</strong>
              <p>{action.helper}</p>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
