import { EmptyState } from '../components/empty-state';
import { PageIntro } from '../components/page-intro';
import { RecordForm } from '../components/record-form';
import { StatsGrid } from '../components/stats-grid';
import { useEnlaceData } from '../modules/records/use-enlace-data';

export function EnlacePage() {
  const {
    session,
    records,
    latestRecord,
    latestRosterReport,
    availableDelegations,
    fieldCatalogs,
    createRecord,
  } = useEnlaceData();

  if (!session) {
    return null;
  }

  return (
    <div className="stack-lg">
      <section className="panel">
        <PageIntro
          eyebrow="Captura operativa"
          title="Registro de bienes vehiculares"
          description="Captura la informacion desde tu delegacion con apoyo de catalogos controlados."
        />

        <StatsGrid
          items={[
            { label: 'Delegacion asignada', value: session.user.delegation?.name ?? '-' },
            { label: 'Capturas realizadas', value: records.length },
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

      {fieldCatalogs ? (
        <RecordForm
          delegations={availableDelegations}
          fieldCatalogs={fieldCatalogs}
          onSubmit={createRecord}
        />
      ) : (
        <section className="panel">
          <EmptyState
            title="Cargando catalogos de captura"
            description="Espera un momento para desplegar las opciones del formulario."
          />
        </section>
      )}
    </div>
  );
}
