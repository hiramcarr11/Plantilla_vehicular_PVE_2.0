import { EmptyState } from '../components/empty-state';
import { PageIntro } from '../components/page-intro';
import { StatsGrid } from '../components/stats-grid';
import { useCapturistData } from '../modules/records/use-capturist-data';

export function CapturistRecordsPage() {
  const { session, records, latestRecord } = useCapturistData();

  if (!session) {
    return null;
  }

  return (
    <div className="stack-lg">
      <section className="panel">
        <PageIntro
          eyebrow="Seguimiento"
          title="Mis capturas"
          description="Consulta todas las capturas registradas desde tu delegación en una sola vista."
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

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Historial</p>
            <h2>Todas mis capturas</h2>
          </div>
          <div className="panel-meta">{records.length} registros</div>
        </div>

        {records.length === 0 ? (
          <EmptyState
            title="No hay capturas para mostrar"
            description="Usa el formulario para registrar el primer vehículo de tu delegación."
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
                  <th>Delegación</th>
                  <th>Resguardante</th>
                  <th>Estatus</th>
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
