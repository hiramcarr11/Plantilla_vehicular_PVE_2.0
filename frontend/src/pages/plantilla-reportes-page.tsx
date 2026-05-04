import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '../components/empty-state';
import { LoadingSpinner } from '../components/loading-spinner';
import { api } from '../lib/api';
import { formatUserName } from '../lib/format-user-name';
import { socket } from '../lib/socket';
import { useAuth } from '../modules/auth/auth-context';
import type { Region, RegionRosterReportOverviewRow } from '../types';

type ReportStatus = RegionRosterReportOverviewRow['status'];

const REPORT_STATUS_UI: Record<
  ReportStatus,
  {
    label: string;
    description: string;
    tone: 'neutral' | 'warning' | 'success' | 'info';
  }
> = {
  NOT_REPORTED: {
    label: 'Sin reporte',
    description: 'La región aún no ha enviado cierre.',
    tone: 'neutral',
  },
  PENDING_CHANGES: {
    label: 'Pendiente por cambios',
    description: 'Existen movimientos posteriores al último cierre.',
    tone: 'warning',
  },
  REPORTED_WITH_CHANGES: {
    label: 'Reportado con cambios',
    description: 'La región confirmó movimientos recientes.',
    tone: 'info',
  },
  REPORTED_WITHOUT_CHANGES: {
    label: 'Reportado sin cambios',
    description: 'La región confirmó sin movimientos nuevos.',
    tone: 'success',
  },
};

function getReportStatusUi(status: ReportStatus) {
  return REPORT_STATUS_UI[status];
}

function getPendingDelegationText(row: RegionRosterReportOverviewRow) {
  if (row.pendingDelegationReports === 0) {
    return 'Sin pendientes';
  }

  return `${row.pendingDelegationReports} pendiente${
    row.pendingDelegationReports === 1 ? '' : 's'
  }`;
}

function getLastRegionalReportText(row: RegionRosterReportOverviewRow) {
  if (!row.lastReport) {
    return 'Sin reporte';
  }

  return new Date(row.lastReport.submittedAt).toLocaleString();
}

export function PlantillaReportesPage() {
  const { session } = useAuth();
  const [catalogRegions, setCatalogRegions] = useState<Region[]>([]);
  const [reportOverview, setReportOverview] = useState<RegionRosterReportOverviewRow[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      return;
    }

    const refresh = async () => {
      setIsLoading(true);

      try {
        const [loadedCatalogRegions, loadedReportOverview] = await Promise.all([
          api.getRegions(session.accessToken),
          api.getRosterReportOverview(
            session.accessToken,
            selectedRegionId || undefined,
          ),
        ]);

        setCatalogRegions(loadedCatalogRegions);
        setReportOverview(loadedReportOverview);
      } finally {
        setIsLoading(false);
      }
    };

    void refresh();

    socket.on('records.created', refresh);
    socket.on('records.changed', refresh);
    socket.on('reports.submitted', refresh);

    return () => {
      socket.off('records.created', refresh);
      socket.off('records.changed', refresh);
      socket.off('reports.submitted', refresh);
    };
  }, [selectedRegionId, session]);

  const reportStatusTotals = useMemo(
    () => ({
      notReported: reportOverview.filter((row) => row.status === 'NOT_REPORTED').length,
      pendingChanges: reportOverview.filter((row) => row.status === 'PENDING_CHANGES').length,
      reportedWithoutChanges: reportOverview.filter(
        (row) => row.status === 'REPORTED_WITHOUT_CHANGES',
      ).length,
      reportedWithChanges: reportOverview.filter(
        (row) => row.status === 'REPORTED_WITH_CHANGES',
      ).length,
    }),
    [reportOverview],
  );

  if (!session) {
    return null;
  }

  if (isLoading) {
    return <LoadingSpinner message="Cargando reportes regionales..." />;
  }

  return (
    <div className="stack-lg">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Reportes regionales</p>
            <h2>Seguimiento de cierre por región</h2>
          </div>

          <div className="panel-meta">{reportOverview.length} regiones</div>
        </div>

        <div className="report-status-grid">
          <div className="report-status-card is-neutral">
            <span>Sin reporte</span>
            <strong>{reportStatusTotals.notReported}</strong>
          </div>

          <div className="report-status-card is-warning">
            <span>Pendientes por cambios</span>
            <strong>{reportStatusTotals.pendingChanges}</strong>
          </div>

          <div className="report-status-card is-success">
            <span>Reportadas sin cambios</span>
            <strong>{reportStatusTotals.reportedWithoutChanges}</strong>
          </div>

          <div className="report-status-card is-info">
            <span>Reportadas con cambios</span>
            <strong>{reportStatusTotals.reportedWithChanges}</strong>
          </div>
        </div>

        <div className="form-grid director-filter-grid">
          <label className="field">
            <span>Región</span>
            <select
              value={selectedRegionId}
              onChange={(event) => setSelectedRegionId(event.target.value)}
            >
              <option value="">Todas las regiones</option>
              {catalogRegions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Estado operativo</p>
            <h2>Detalle de reportes</h2>
          </div>
        </div>

        {reportOverview.length === 0 ? (
          <EmptyState
            title="No hay reportes para mostrar"
            description="Ajusta los filtros o espera a que las regiones comiencen a enviar reportes."
          />
        ) : (
          <div className="table-wrapper report-table-wrapper">
            <table className="report-overview-table">
              <thead>
                <tr>
                  <th>Región</th>
                  <th>Estado operativo</th>
                  <th>Delegaciones pendientes</th>
                  <th>Último envío regional</th>
                  <th>Director operativo</th>
                </tr>
              </thead>
              <tbody>
                {reportOverview.map((row) => {
                  const statusInfo = getReportStatusUi(row.status);

                  return (
                    <tr key={row.regionId}>
                      <td>
                        <strong>{row.regionName}</strong>
                      </td>
                      <td>
                        <div className="report-status-cell">
                          <span className={`report-status-badge is-${statusInfo.tone}`}>
                            {statusInfo.label}
                          </span>
                          <small>{statusInfo.description}</small>
                        </div>
                      </td>
                      <td>
                        <span className="report-pending-text">
                          {getPendingDelegationText(row)}
                        </span>
                      </td>
                      <td>{getLastRegionalReportText(row)}</td>
                      <td>{formatUserName(row.lastReport?.submittedBy)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}