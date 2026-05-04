import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { EmptyState } from '../components/empty-state';
import { GroupedRecords } from '../components/grouped-records';
import { LoadingSpinner } from '../components/loading-spinner';
import { api } from '../lib/api';
import { formatUserName } from '../lib/format-user-name';
import { socket } from '../lib/socket';
import { useAuth } from '../modules/auth/auth-context';
import { openRecordDetails, openTransferDialog } from '../modules/records/record-activity';
import type {
  GroupedRegionRecords,
  RecordFieldCatalogMap,
  Region,
  RosterReportOverviewRow,
  VehicleRecord,
  VehicleRosterReport,
} from '../types';

export function DirectorOperativoPage() {
  const { session } = useAuth();
  const [regions, setRegions] = useState<GroupedRegionRecords[]>([]);
  const [catalogRegions, setCatalogRegions] = useState<Region[]>([]);
  const [fieldCatalogs, setFieldCatalogs] = useState<RecordFieldCatalogMap | null>(null);
  const [delegationReportOverview, setDelegationReportOverview] = useState<RosterReportOverviewRow[]>([]);
  const [regionalReports, setRegionalReports] = useState<VehicleRosterReport[]>([]);

  useEffect(() => {
    if (!session) {
      return;
    }

    const refresh = async () => {
      const [
        loadedRegions,
        loadedFieldCatalogs,
        loadedCatalogRegions,
        loadedDelegationReportOverview,
        loadedRegionalReports,
      ] = await Promise.all([
        api.getRegionalOverview(session.accessToken),
        api.getRecordFieldCatalog(session.accessToken),
        api.getRegions(session.accessToken),
        api.getRegionalRosterReportOverview(session.accessToken),
        api.getMyRegionalRosterReports(session.accessToken),
      ]);

      setRegions(loadedRegions);
      setFieldCatalogs(loadedFieldCatalogs);
      setCatalogRegions(loadedCatalogRegions);
      setDelegationReportOverview(loadedDelegationReportOverview);
      setRegionalReports(loadedRegionalReports);
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

  const transferRecord = async (record: VehicleRecord) => {
    if (!session) {
      return;
    }

    try {
      const transferred = await openTransferDialog({
        record,
        regions: catalogRegions,
        token: session.accessToken,
        onTransferred: async () => {
          const loadedRegions = await api.getRegionalOverview(session.accessToken);
          setRegions(loadedRegions);
        },
      });

      if (!transferred) {
        return;
      }

      await Swal.fire({
        icon: 'success',
        title: 'Traslado registrado',
        text: 'El movimiento quedo registrado en la bitacora.',
        confirmButtonText: 'Entendido',
      });
    } catch (requestError) {
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo trasladar el vehiculo',
        text: (requestError as Error).message,
        confirmButtonText: 'Entendido',
      });
    }
  };

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

  if (!fieldCatalogs) {
    return <LoadingSpinner message="Cargando datos regionales..." />;
  }

  return (
    <div className="stack-lg">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Validación de delegaciones</p>
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

      <GroupedRecords
        regions={regions}
        fieldCatalogs={fieldCatalogs}
        eyebrow="Vista regional"
        title="Delegaciones bajo tu responsabilidad"
        description="Revisa el flujo de captura de tu region y consulta el historial operativo por delegacion."
        onRecordSelect={(record) => void openRecordDetails(record)}
        renderRecordActions={(record) =>
          record.recordState === 'CURRENT' ? (
            <button
              className="inline-button"
              type="button"
              onClick={() => void transferRecord(record)}
            >
              Trasladar
            </button>
          ) : null
        }
      />
    </div>
  );
}

