import { DirectorOaxacaMap } from '../components/director-oaxaca-map';
import { EmptyState } from '../components/empty-state';
import { PageIntro } from '../components/page-intro';
import { StatsGrid } from '../components/stats-grid';
import { useAuth } from '../modules/auth/auth-context';
import { useDirectorOverview } from '../modules/director/use-director-overview';

export function DirectorMapPage() {
  const { session } = useAuth();
  const {
    overview,
    selectedRegionId,
    setSelectedRegionId,
    selectedDelegationId,
    setSelectedDelegationId,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    availableDelegations,
    selectedRegionName,
    selectedDelegationName,
  } = useDirectorOverview({ accessToken: session?.accessToken });

  if (!session) {
    return null;
  }

  if (!overview) {
    return (
      <section className="panel">
        <EmptyState
          title="Cargando mapa directivo"
          description="Espera un momento para consolidar el mapa territorial."
        />
      </section>
    );
  }

  const { kpis, filters } = overview;

  return (
    <div className="stack-lg">
      <section className="panel">
        <PageIntro
          eyebrow="Dirección"
          title="Mapa directivo"
          description="Consulta la distribución territorial de vehículos en un mapa dinámico con filtros por fecha, región y delegación."
        />

        <div className="form-grid director-filter-grid">
          <label className="field">
            <span>Región</span>
            <select
              value={selectedRegionId}
              onChange={(event) => {
                setSelectedRegionId(event.target.value);
                setSelectedDelegationId('');
              }}
            >
              <option value="">Todas las regiones</option>
              {filters.regions.map((region) => (
                <option key={region.regionId} value={region.regionId}>
                  {region.regionName}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Delegación</span>
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
            <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          </label>

          <label className="field">
            <span>Hasta</span>
            <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </label>
        </div>

        <StatsGrid
          items={[
            { label: 'Regiones visibles', value: selectedRegionName },
            { label: 'Delegaciones visibles', value: selectedDelegationName },
            { label: 'Vehículos totales', value: kpis.totalRecords },
            { label: 'Vehículos activos', value: kpis.totalActive },
          ]}
        />
      </section>

      <section className="panel stack-md">
        <DirectorOaxacaMap overview={overview} />
      </section>
    </div>
  );
}
