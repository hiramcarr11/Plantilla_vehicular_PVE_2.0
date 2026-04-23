import { useEffect, useMemo, useState } from 'react';
import { GroupedRecords } from '../components/grouped-records';
import { api } from '../lib/api';
import { connectSocketWithAuth, socket } from '../lib/socket';
import { useAuth } from '../modules/auth/auth-context';
import type { GroupedRegionRecords, RecordFieldCatalogMap, Region } from '../types';

export function AdminPage() {
  const { session } = useAuth();
  const [regions, setRegions] = useState<GroupedRegionRecords[]>([]);
  const [catalogRegions, setCatalogRegions] = useState<Region[]>([]);
  const [fieldCatalogs, setFieldCatalogs] = useState<RecordFieldCatalogMap | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<string>('');
  const [selectedDelegationId, setSelectedDelegationId] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  useEffect(() => {
    if (!session) {
      return;
    }

    const refresh = async () => {
      const [loadedRegions, loadedFieldCatalogs, loadedCatalogRegions] = await Promise.all([
        api.getAdminOverview(
          session.accessToken,
          selectedRegionId || undefined,
          selectedDelegationId || undefined,
          dateFrom || undefined,
          dateTo || undefined,
        ),
        api.getRecordFieldCatalog(session.accessToken),
        api.getRegions(session.accessToken),
      ]);

      setRegions(loadedRegions);
      setFieldCatalogs(loadedFieldCatalogs);
      setCatalogRegions(loadedCatalogRegions);
    };

    void refresh();
    connectSocketWithAuth();
    socket.on('records.created', refresh);

    return () => {
      socket.off('records.created', refresh);
      socket.disconnect();
    };
  }, [dateFrom, dateTo, selectedDelegationId, selectedRegionId, session]);

  const availableDelegations = useMemo(() => {
    if (!selectedRegionId) {
      return catalogRegions.flatMap((region) => region.delegations);
    }

    return catalogRegions.find((region) => region.id === selectedRegionId)?.delegations ?? [];
  }, [catalogRegions, selectedRegionId]);

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
      title="Operación completa del sistema"
      description="Supervisa la captura de todas las regiones y detecta concentración operativa por delegación."
      vehicleClassAfterDate
      headerFilters={
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
              {catalogRegions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
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
      }
    />
  );
}
