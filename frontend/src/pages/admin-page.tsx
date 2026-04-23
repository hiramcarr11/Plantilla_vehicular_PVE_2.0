import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { GroupedRecords } from '../components/grouped-records';
import { api } from '../lib/api';
import { connectSocketWithAuth, socket } from '../lib/socket';
import { useAuth } from '../modules/auth/auth-context';
import type {
  GroupedRegionRecords,
  RecordFieldCatalogMap,
  Region,
  RosterReportOverviewRow,
  VehicleRecord,
} from '../types';

export function AdminPage() {
  const { session } = useAuth();
  const [regions, setRegions] = useState<GroupedRegionRecords[]>([]);
  const [catalogRegions, setCatalogRegions] = useState<Region[]>([]);
  const [fieldCatalogs, setFieldCatalogs] = useState<RecordFieldCatalogMap | null>(null);
  const [reportOverview, setReportOverview] = useState<RosterReportOverviewRow[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<string>('');
  const [selectedDelegationId, setSelectedDelegationId] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  useEffect(() => {
    if (!session) {
      return;
    }

    const refresh = async () => {
      const [
        loadedRegions,
        loadedFieldCatalogs,
        loadedCatalogRegions,
        loadedReportOverview,
      ] = await Promise.all([
        api.getAdminOverview(
          session.accessToken,
          selectedRegionId || undefined,
          selectedDelegationId || undefined,
          dateFrom || undefined,
          dateTo || undefined,
        ),
        api.getRecordFieldCatalog(session.accessToken),
        api.getRegions(session.accessToken),
        api.getRosterReportOverview(session.accessToken),
      ]);

      setRegions(loadedRegions);
      setFieldCatalogs(loadedFieldCatalogs);
      setCatalogRegions(loadedCatalogRegions);
      setReportOverview(loadedReportOverview);
    };

    void refresh();
    connectSocketWithAuth();
    socket.on('records.created', refresh);
    socket.on('records.changed', refresh);
    socket.on('reports.submitted', refresh);

    return () => {
      socket.off('records.created', refresh);
      socket.off('records.changed', refresh);
      socket.off('reports.submitted', refresh);
      socket.disconnect();
    };
  }, [dateFrom, dateTo, selectedDelegationId, selectedRegionId, session]);

  const availableDelegations = useMemo(() => {
    if (!selectedRegionId) {
      return catalogRegions.flatMap((region) => region.delegations);
    }

    return catalogRegions.find((region) => region.id === selectedRegionId)?.delegations ?? [];
  }, [catalogRegions, selectedRegionId]);

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

  const transferRecord = async (record: VehicleRecord) => {
    if (!session) {
      return;
    }

    const delegationOptions = Object.fromEntries(
      catalogRegions
        .flatMap((region) =>
          region.delegations.map((delegation) => [
            delegation.id,
            `${region.name} - ${delegation.name}`,
          ]),
        )
        .filter(([delegationId]) => delegationId !== record.delegation.id),
    );

    const targetConfirmation = await Swal.fire({
      icon: 'question',
      title: 'Trasladar vehiculo',
      text: `Selecciona la nueva delegacion para ${record.plates}.`,
      input: 'select',
      inputOptions: delegationOptions,
      inputPlaceholder: 'Selecciona una delegacion',
      showCancelButton: true,
      confirmButtonText: 'Continuar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => (!value ? 'Selecciona una delegacion.' : null),
    });

    if (!targetConfirmation.isConfirmed || typeof targetConfirmation.value !== 'string') {
      return;
    }

    const reasonConfirmation = await Swal.fire({
      icon: 'question',
      title: 'Motivo del traslado',
      input: 'textarea',
      inputPlaceholder: 'Captura el motivo del traslado',
      showCancelButton: true,
      confirmButtonText: 'Registrar traslado',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => (!value.trim() ? 'Captura el motivo.' : null),
    });

    if (!reasonConfirmation.isConfirmed || typeof reasonConfirmation.value !== 'string') {
      return;
    }

    try {
      await api.transferRecord(
        record.id,
        targetConfirmation.value,
        reasonConfirmation.value,
        session.accessToken,
      );

      const [loadedRegions, loadedReportOverview] = await Promise.all([
        api.getAdminOverview(
          session.accessToken,
          selectedRegionId || undefined,
          selectedDelegationId || undefined,
          dateFrom || undefined,
          dateTo || undefined,
        ),
        api.getRosterReportOverview(session.accessToken),
      ]);

      setRegions(loadedRegions);
      setReportOverview(loadedReportOverview);

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

  if (!session) {
    return null;
  }

  if (!fieldCatalogs) {
    return null;
  }

  return (
    <GroupedRecords
      regions={regions}
      fieldCatalogs={fieldCatalogs}
      eyebrow="Vista global"
      title="Operacion completa del sistema"
      description="Supervisa la captura de todas las regiones y el estado de reportes por delegacion."
      vehicleClassAfterDate
      renderRecordActions={(record) => (
        <button className="inline-button" type="button" onClick={() => transferRecord(record)}>
          Trasladar
        </button>
      )}
      headerFilters={
        <>
          <div className="report-status-grid">
            <div className="report-status-card">
              <span>Sin reporte</span>
              <strong>{reportStatusTotals.notReported}</strong>
            </div>
            <div className="report-status-card">
              <span>Pendientes por cambios</span>
              <strong>{reportStatusTotals.pendingChanges}</strong>
            </div>
            <div className="report-status-card">
              <span>Reportado sin cambios</span>
              <strong>{reportStatusTotals.reportedWithoutChanges}</strong>
            </div>
            <div className="report-status-card">
              <span>Reportado con cambios</span>
              <strong>{reportStatusTotals.reportedWithChanges}</strong>
            </div>
          </div>

          <div className="form-grid director-filter-grid">
            <label className="field">
              <span>Region</span>
              <select
                value={selectedRegionId}
                onChange={(event) => {
                  setSelectedRegionId(event.target.value);
                  setSelectedDelegationId('');
                }}
              >
                <option value="">Todas las regiones</option>
                {catalogRegions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Delegacion</span>
              <select
                value={selectedDelegationId}
                onChange={(event) => setSelectedDelegationId(event.target.value)}
              >
                <option value="">Todas las delegaciones</option>
                {availableDelegations.map((delegation) => (
                  <option key={delegation.id} value={delegation.id}>
                    {delegation.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Desde</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
              />
            </label>

            <label className="field">
              <span>Hasta</span>
              <input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
              />
            </label>
          </div>
        </>
      }
    />
  );
}
