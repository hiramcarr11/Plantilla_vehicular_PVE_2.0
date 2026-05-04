import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { GroupedRecords } from "../components/grouped-records";
import { LoadingSpinner } from "../components/loading-spinner";
import { api } from "../lib/api";
import { formatUserName } from "../lib/format-user-name";
import { socket } from "../lib/socket";
import { useAuth } from "../modules/auth/auth-context";
import {
  openRecordDetails,
  openTransferDialog,
} from "../modules/records/record-activity";
import type {
  GroupedRegionRecords,
  RecordFieldCatalogMap,
  Region,
  RegionRosterReportOverviewRow,
  VehicleRecord,
} from "../types";

type ReportStatus = RegionRosterReportOverviewRow["status"];

const REPORT_STATUS_UI: Record<
  ReportStatus,
  {
    label: string;
    description: string;
    tone: "neutral" | "warning" | "success" | "info";
  }
> = {
  NOT_REPORTED: {
    label: "Sin reporte",
    description: "La región aún no ha enviado cierre.",
    tone: "neutral",
  },
  PENDING_CHANGES: {
    label: "Pendiente por cambios",
    description: "Existen movimientos posteriores al último cierre.",
    tone: "warning",
  },
  REPORTED_WITH_CHANGES: {
    label: "Reportado con cambios",
    description: "La región confirmó movimientos recientes.",
    tone: "info",
  },
  REPORTED_WITHOUT_CHANGES: {
    label: "Reportado sin cambios",
    description: "La región confirmó sin movimientos nuevos.",
    tone: "success",
  },
};

function getReportStatusUi(status: ReportStatus) {
  return REPORT_STATUS_UI[status];
}

function getPendingDelegationText(row: RegionRosterReportOverviewRow) {
  if (row.pendingDelegationReports === 0) {
    return "Sin pendientes";
  }

  return `${row.pendingDelegationReports} pendiente${
    row.pendingDelegationReports === 1 ? "" : "s"
  }`;
}

function getLastRegionalReportText(row: RegionRosterReportOverviewRow) {
  if (!row.lastReport) {
    return "Sin reporte";
  }

  return new Date(row.lastReport.submittedAt).toLocaleString();
}

export function PlantillaVehicularPage() {
  const { session } = useAuth();
  const [regions, setRegions] = useState<GroupedRegionRecords[]>([]);
  const [catalogRegions, setCatalogRegions] = useState<Region[]>([]);
  const [fieldCatalogs, setFieldCatalogs] =
    useState<RecordFieldCatalogMap | null>(null);
  const [reportOverview, setReportOverview] = useState<
    RegionRosterReportOverviewRow[]
  >([]);
  const [selectedRegionId, setSelectedRegionId] = useState<string>("");
  const [selectedDelegationId, setSelectedDelegationId] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

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
        api.getPlantillaVehicularOverview(
          session.accessToken,
          selectedRegionId || undefined,
          selectedDelegationId || undefined,
          dateFrom || undefined,
          dateTo || undefined,
        ),
        api.getRecordFieldCatalog(session.accessToken),
        api.getRegions(session.accessToken),
        api.getRosterReportOverview(
          session.accessToken,
          selectedRegionId || undefined,
        ),
      ]);

      setRegions(loadedRegions);
      setFieldCatalogs(loadedFieldCatalogs);
      setCatalogRegions(loadedCatalogRegions);
      setReportOverview(loadedReportOverview);
    };

    void refresh();
    socket.on("records.created", refresh);
    socket.on("records.changed", refresh);
    socket.on("reports.submitted", refresh);

    return () => {
      socket.off("records.created", refresh);
      socket.off("records.changed", refresh);
      socket.off("reports.submitted", refresh);
    };
  }, [dateFrom, dateTo, selectedDelegationId, selectedRegionId, session]);

  const availableDelegations = useMemo(() => {
    if (!selectedRegionId) {
      return catalogRegions.flatMap((region) => region.delegations);
    }

    return (
      catalogRegions.find((region) => region.id === selectedRegionId)
        ?.delegations ?? []
    );
  }, [catalogRegions, selectedRegionId]);

  const reportStatusTotals = useMemo(
    () => ({
      notReported: reportOverview.filter((row) => row.status === "NOT_REPORTED")
        .length,
      pendingChanges: reportOverview.filter(
        (row) => row.status === "PENDING_CHANGES",
      ).length,
      reportedWithoutChanges: reportOverview.filter(
        (row) => row.status === "REPORTED_WITHOUT_CHANGES",
      ).length,
      reportedWithChanges: reportOverview.filter(
        (row) => row.status === "REPORTED_WITH_CHANGES",
      ).length,
    }),
    [reportOverview],
  );

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
          const [loadedRegions, loadedReportOverview] = await Promise.all([
            api.getPlantillaVehicularOverview(
              session.accessToken,
              selectedRegionId || undefined,
              selectedDelegationId || undefined,
              dateFrom || undefined,
              dateTo || undefined,
            ),
            api.getRosterReportOverview(
              session.accessToken,
              selectedRegionId || undefined,
            ),
          ]);

          setRegions(loadedRegions);
          setReportOverview(loadedReportOverview);
        },
      });

      if (!transferred) {
        return;
      }

      await Swal.fire({
        icon: "success",
        title: "Traslado registrado",
        text: "El movimiento quedo registrado en la bitacora.",
        confirmButtonText: "Entendido",
      });
    } catch (requestError) {
      await Swal.fire({
        icon: "error",
        title: "No se pudo trasladar el vehiculo",
        text: (requestError as Error).message,
        confirmButtonText: "Entendido",
      });
    }
  };

  if (!session) {
    return null;
  }

  if (!fieldCatalogs) {
    return <LoadingSpinner message="Cargando vista administrativa..." />;
  }

  return (
    <GroupedRecords
      regions={regions}
      fieldCatalogs={fieldCatalogs}
      eyebrow="Vista global"
      title="Operacion completa del sistema"
      description="Supervisa la captura de todas las regiones y el estado de reportes regionales."
      vehicleClassAfterDate
      onRecordSelect={(record) => void openRecordDetails(record)}
      renderRecordActions={(record) =>
        record.recordState === "CURRENT" ? (
          <button
            className="inline-button"
            type="button"
            onClick={() => transferRecord(record)}
          >
            Trasladar
          </button>
        ) : null
      }
      headerFilters={
        <>
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

          <section className="report-overview-block">
            <div className="report-table-header">
              <div>
                <p className="eyebrow">Reportes regionales</p>
                <h3>Seguimiento de cierre por región</h3>
              </div>
              <span className="panel-meta">
                {reportOverview.length} regiones
              </span>
            </div>

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
                            <span
                              className={`report-status-badge is-${statusInfo.tone}`}
                            >
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
          </section>

          <div className="form-grid director-filter-grid">
            <label className="field">
              <span>Region</span>
              <select
                value={selectedRegionId}
                onChange={(event) => {
                  setSelectedRegionId(event.target.value);
                  setSelectedDelegationId("");
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
                onChange={(event) =>
                  setSelectedDelegationId(event.target.value)
                }
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
