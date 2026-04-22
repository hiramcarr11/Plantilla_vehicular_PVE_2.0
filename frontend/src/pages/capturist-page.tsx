import { EmptyState } from '../components/empty-state';
import { PageIntro } from '../components/page-intro';
import { RecordForm } from '../components/record-form';
import { StatsGrid } from '../components/stats-grid';
import { useCapturistData } from '../modules/records/use-capturist-data';

export function CapturistPage() {
  const { session, records, latestRecord, availableDelegations, fieldCatalogs, createRecord } =
    useCapturistData();

  if (!session) {
    return null;
  }

  return (
    <div className="stack-lg">
      <section className="panel">
        <PageIntro
          eyebrow="Captura operativa"
          title="Registro de bienes vehiculares"
          description="Captura la información desde tu delegación con apoyo de catálogos controlados."
        />

        <StatsGrid
          items={[
            { label: 'Delegación asignada', value: session.user.delegation?.name ?? '-' },
            { label: 'Capturas realizadas', value: records.length },
            {
              label: 'Última captura',
              value: latestRecord ? new Date(latestRecord.createdAt).toLocaleDateString() : '-',
              helper: latestRecord ? latestRecord.plates : 'Sin registros',
            },
            { label: 'Estado de canal', value: 'En línea' },
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
            title="Cargando catálogos de captura"
            description="Espera un momento para desplegar las opciones del formulario."
          />
        </section>
      )}
    </div>
  );
}
