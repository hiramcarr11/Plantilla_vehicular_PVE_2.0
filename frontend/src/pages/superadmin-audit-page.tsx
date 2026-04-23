import { useEffect, useState } from 'react';
import { EmptyState } from '../components/empty-state';
import { PageIntro } from '../components/page-intro';
import { StatsGrid } from '../components/stats-grid';
import { api } from '../lib/api';
import { connectSocketWithAuth, socket } from '../lib/socket';
import { useAuth } from '../modules/auth/auth-context';
import type { AuditLog } from '../types';

export function SuperAdminAuditPage() {
  const { session } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    if (!session) {
      return;
    }

    const loadAuditLogs = async () => {
      setAuditLogs(await api.getAuditLogs(session.accessToken));
    };

    void loadAuditLogs();
    connectSocketWithAuth();
    socket.on('audit.created', loadAuditLogs);

    return () => {
      socket.off('audit.created', loadAuditLogs);
      socket.disconnect();
    };
  }, [session]);

  if (!session) {
    return null;
  }

  return (
    <div className="stack-lg">
      <section className="panel">
        <PageIntro
          eyebrow="Bitácora"
          title="Actividad del sistema"
          description="Consulta movimientos críticos con visibilidad inmediata y orden cronológico."
        />

        <StatsGrid
          items={[
            { label: 'Eventos registrados', value: auditLogs.length },
            {
              label: 'Último movimiento',
              value: auditLogs[0] ? new Date(auditLogs[0].createdAt).toLocaleTimeString() : '-',
              helper: auditLogs[0]?.action ?? 'Sin actividad',
            },
            {
              label: 'Último actor',
              value: auditLogs[0]?.actor?.fullName ?? 'Sistema',
            },
            {
              label: 'Entidad reciente',
              value: auditLogs[0]?.entityType ?? '-',
            },
          ]}
        />
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Seguimiento</p>
            <h2>Actividad reciente</h2>
          </div>
          <div className="panel-meta">{auditLogs.length} eventos</div>
        </div>

        {auditLogs.length === 0 ? (
          <EmptyState
            title="No hay eventos en la bitácora"
            description="La actividad crítica aparecerá aquí en cuanto el sistema registre movimientos."
          />
        ) : (
          <div className="activity-list">
            {auditLogs.map((auditLog) => (
              <article className="activity-item" key={auditLog.id}>
                <div className="activity-item-head">
                  <strong>{auditLog.action}</strong>
                  <span>{new Date(auditLog.createdAt).toLocaleString()}</span>
                </div>
                <p>{auditLog.actor?.fullName ?? 'Sistema'}</p>
                <span>
                  {auditLog.entityType} #{auditLog.entityId}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
