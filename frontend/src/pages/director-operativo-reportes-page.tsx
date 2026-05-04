import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { EmptyState } from '../components/empty-state';
import { LoadingSpinner } from '../components/loading-spinner';
import { api } from '../lib/api';
import { formatUserName } from '../lib/format-user-name';
import { socket } from '../lib/socket';
import { useAuth } from '../modules/auth/auth-context';
import type { RosterReportOverviewRow, VehicleRosterReport } from '../types';

export function DirectorOperativoReportesPage() {
  const { session } = useAuth();
  const [delegationReportOverview, setDelegationReportOverview] = useState<RosterReportOverviewRow[]>([]);
  const [regionalReports, setRegionalReports] = useState<VehicleRosterReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      return;
    }

    const refresh = async () => {
      setIsLoading(true);
      try {
        const [loadedDelegationReportOverview, loadedRegionalReports] = await Promise.all([
          api.getRegionalRosterReportOverview(session.accessToken),
          api.getMyRegionalRosterReports(session.accessToken),
        ]);

        setDelegationReportOverview(loadedDelegationReportOverview);
        setRegionalReports(loadedRegionalReports);
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
  }, [session]);

  const reportStatusTotals = useMemo(
    () => ({
      notReported: delegationReportOverview.filter((row) => row.status === 'NOT_REPORTED').length,
      pendingChanges: delegationReportOverview.filter((row) => row.status === 'PENDING_CHANGES').length,
      reportedWithoutChanges: delegationReportOverview.filter(
        (row) => row.status === 'REPORTED_WITHOUT_CHANGES',
      ).length,
      reportedWithChanges: delegationReportOverview.filter(
        (row) => row.status === 'REPORTED_WITH_CHANGES',
      ).length,
    }),
    [delegationReportOverview],
  );

  const latestRegionalReport = regionalReports[0];

  const submitRegionalReport = async () => {
    if (!session) {
      return;
    }

    const confirmation = await Swal.fire({
      icon: 'question',
      title: 'Validar cierre regional',
      text: 'Se confirmaran los reportes capturados por las delegaciones de tu region.',
      input: 'textarea',
      inputPlaceholder: 'Observaciones opcionales',
      showCancelButton: true,
      confirmButtonText: 'Enviar reporte',
      cancelButtonText: 'Cancelar',
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    try {
      const report = await api.submitRegionalRosterReport(
        typeof confirmation.value === 'string' ? confirmation.value : '',
        session.accessToken,
      );
      const [loadedDelegationReportOverview, loadedRegionalReports] = await Promise.all([
        api.getRegionalRosterReportOverview(session.accessToken),
        api.getMyRegionalRosterReports(session.accessToken),
      ]);

      setDelegationReportOverview(loadedDelegationReportOverview);
      setRegionalReports([report, ...loadedRegionalReports.filter((row) => row.id !== report.id)]);

      await Swal.fire({
        icon: 'success',
        title: report.hasChanges ? 'Reporte regional enviado con cambios' : 'Reporte regional enviado sin cambios',
        text: `Delegaciones confirmadas desde el ultimo reporte regional: ${report.confirmedDelegationReports}.`,
        confirmButtonText: 'Entendido',
      });
    } catch (requestError) {
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo enviar el reporte regional',
        text: (requestError as Error).message,
        confirmButtonText: 'Entendido',
      });
    }
  };

  if (!session) {
    return null;
  }

  if (isLoading) {
    return <LoadingSpinner message="Cargando datos regionales..." />;
  }

  return (
    <div className="stack-lg">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Validación regional</p>
            <h2>Confirmación mensual regional</h2>
          </div>
          <div className="panel-actions">
            <div className="panel-meta">
              Ultimo reporte regional: {latestRegionalReport ? new Date(latestRegionalReport.submittedAt).toLocaleDateString() : 'Sin reporte'}
            </div>
            <button className="primary-button" type="button" onClick={submitRegionalReport}>
              Validar cierre regional
            </button>
          </div>
        </div>

        <div className="report-status-grid">
          <div className="report-status-card">
            <span>Sin validación mensual</span>
            <strong>{reportStatusTotals.notReported}</strong>
          </div>
          <div className="report-status-card">
            <span>Cambios sin validar</span>
            <strong>{reportStatusTotals.pendingChanges}</strong>
          </div>
          <div className="report-status-card">
            <span>Validadas sin cambios</span>
            <strong>{reportStatusTotals.reportedWithoutChanges}</strong>
          </div>
          <div className="report-status-card">
            <span>Validadas con cambios</span>
            <strong>{reportStatusTotals.reportedWithChanges}</strong>
          </div>
        </div>

        {delegationReportOverview.length === 0 ? (
          <EmptyState
            title="No hay delegaciones para mostrar"
            description="No se encontraron delegaciones asociadas a tu region."
          />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Delegacion</th>
                  <th>Estado de validación</th>
                  <th>Movimientos sin validar</th>
                  <th>Última validación</th>
                  <th>Validado por</th>
                </tr>
              </thead>
              <tbody>
                {delegationReportOverview.map((row) => (
                  <tr key={row.delegationId}>
                    <td>{row.delegationName}</td>
                    <td>{row.status}</td>
                    <td>{row.pendingChanges}</td>
                    <td>
                      {row.lastReport
                        ? new Date(row.lastReport.submittedAt).toLocaleString()
                        : 'Sin reporte'}
                    </td>
                    <td>{formatUserName(row.lastReport?.submittedBy)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Validaciones regionales enviadas</p>
            <h2>Historial de cierre regional</h2>
          </div>
          <div className="panel-meta">{regionalReports.length} reportes</div>
        </div>

        {regionalReports.length === 0 ? (
          <EmptyState
            title="Sin reportes regionales"
            description="Cuando confirmes la informacion de las delegaciones, el reporte regional quedara registrado aqui."
          />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Fecha de validación</th>
                  <th>Resultado de validación</th>
                  <th>Delegaciones confirmadas</th>
                  <th>Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {regionalReports.map((report) => (
                  <tr key={report.id}>
                    <td>{new Date(report.submittedAt).toLocaleString()}</td>
                    <td>{report.hasChanges ? 'Con confirmaciones' : 'Sin nuevas confirmaciones'}</td>
                    <td>{report.confirmedDelegationReports}</td>
                    <td>{report.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
