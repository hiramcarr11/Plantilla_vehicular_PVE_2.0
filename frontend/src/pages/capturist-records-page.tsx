import { useMemo, useState } from 'react';
import { EmptyState } from '../components/empty-state';
import { PageIntro } from '../components/page-intro';
import { RecordForm } from '../components/record-form';
import { StatsGrid } from '../components/stats-grid';
import { useCapturistData } from '../modules/records/use-capturist-data';
import type { VehicleRecord } from '../types';

export function CapturistRecordsPage() {
  const {
    session,
    records,
    rosterReports,
    latestRecord,
    latestRosterReport,
    availableDelegations,
    fieldCatalogs,
    updateRecord,
  } = useCapturistData();
  const [editingRecord, setEditingRecord] = useState<VehicleRecord | null>(null);

  const editingValues = useMemo(
    () =>
      editingRecord
        ? {
            delegationId: editingRecord.delegation.id,
            plates: editingRecord.plates,
            brand: editingRecord.brand,
            type: editingRecord.type,
            useType: editingRecord.useType,
            vehicleClass: editingRecord.vehicleClass,
            model: editingRecord.model,
            engineNumber: editingRecord.engineNumber,
            serialNumber: editingRecord.serialNumber,
            custodian: editingRecord.custodian,
            patrolNumber: editingRecord.patrolNumber,
            physicalStatus: editingRecord.physicalStatus,
            status: editingRecord.status,
            assetClassification: editingRecord.assetClassification,
            observation: editingRecord.observation,
          }
        : undefined,
    [editingRecord],
  );

  if (!session) {
    return null;
  }

  return (
    <div className="stack-lg">
      <section className="panel">
        <PageIntro
          eyebrow="Seguimiento"
          title="Mi plantilla vehicular"
          description="Consulta y edita las capturas vigentes de tu delegacion."
        />

        <StatsGrid
          items={[
            { label: 'Delegacion asignada', value: session.user.delegation?.name ?? '-' },
            { label: 'Vehiculos vigentes', value: records.length },
            {
              label: 'Ultima captura',
              value: latestRecord ? new Date(latestRecord.createdAt).toLocaleDateString() : '-',
              helper: latestRecord ? latestRecord.plates : 'Sin registros',
            },
            {
              label: 'Ultimo reporte',
              value: latestRosterReport
                ? new Date(latestRosterReport.submittedAt).toLocaleDateString()
                : 'Sin reporte',
              helper: latestRosterReport
                ? latestRosterReport.hasChanges
                  ? 'Con cambios'
                  : 'Sin cambios'
                : 'Pendiente',
            },
          ]}
        />
      </section>

      {editingRecord && fieldCatalogs && editingValues && (
        <RecordForm
          mode="edit"
          delegations={availableDelegations}
          fieldCatalogs={fieldCatalogs}
          initialValues={editingValues}
          onCancel={() => setEditingRecord(null)}
          onSubmit={async (values) => {
            await updateRecord(editingRecord.id, values);
            setEditingRecord(null);
          }}
        />
      )}

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Plantilla</p>
            <h2>Vehiculos registrados</h2>
          </div>
          <div className="panel-meta">{records.length} registros</div>
        </div>

        {records.length === 0 ? (
          <EmptyState
            title="No hay capturas para mostrar"
            description="Usa el formulario para registrar el primer vehiculo de tu delegacion."
          />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Placas</th>
                  <th>Marca</th>
                  <th>Tipo</th>
                  <th>Delegacion</th>
                  <th>Resguardante</th>
                  <th>Estatus</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td>{new Date(record.createdAt).toLocaleString()}</td>
                    <td>{record.plates}</td>
                    <td>{record.brand}</td>
                    <td>{record.type}</td>
                    <td>{record.delegation.name}</td>
                    <td>{record.custodian}</td>
                    <td>{record.status}</td>
                    <td>
                      <button
                        className="inline-button"
                        type="button"
                        onClick={() => setEditingRecord(record)}
                      >
                        Editar
                      </button>
                    </td>
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
            <p className="eyebrow">Reportes enviados</p>
            <h2>Confirmaciones de plantilla</h2>
          </div>
          <div className="panel-meta">{rosterReports.length} reportes</div>
        </div>

        {rosterReports.length === 0 ? (
          <EmptyState
            title="Sin reportes enviados"
            description="El envio de reporte confirma el estado actual de la plantilla."
          />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Fecha de envio</th>
                  <th>Resultado</th>
                  <th>Movimientos detectados</th>
                  <th>Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {rosterReports.map((report) => (
                  <tr key={report.id}>
                    <td>{new Date(report.submittedAt).toLocaleString()}</td>
                    <td>{report.hasChanges ? 'Con cambios' : 'Sin cambios'}</td>
                    <td>{report.changesSinceLastReport}</td>
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
