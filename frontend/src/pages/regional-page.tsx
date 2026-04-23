import { useEffect, useState } from 'react';
import { GroupedRecords } from '../components/grouped-records';
import { api } from '../lib/api';
import { connectSocketWithAuth, socket } from '../lib/socket';
import { useAuth } from '../modules/auth/auth-context';
import type { GroupedRegionRecords, RecordFieldCatalogMap } from '../types';

export function RegionalPage() {
  const { session } = useAuth();
  const [regions, setRegions] = useState<GroupedRegionRecords[]>([]);
  const [fieldCatalogs, setFieldCatalogs] = useState<RecordFieldCatalogMap | null>(null);

  useEffect(() => {
    if (!session) {
      return;
    }

    const refresh = async () => {
      const [loadedRegions, loadedFieldCatalogs] = await Promise.all([
        api.getRegionalOverview(session.accessToken),
        api.getRecordFieldCatalog(session.accessToken),
      ]);

      setRegions(loadedRegions);
      setFieldCatalogs(loadedFieldCatalogs);
    };

    void refresh();
    connectSocketWithAuth();
    socket.on('records.created', refresh);
    socket.on('records.changed', refresh);

    return () => {
      socket.off('records.created', refresh);
      socket.off('records.changed', refresh);
      socket.disconnect();
    };
  }, [session]);

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
      eyebrow="Vista regional"
      title="Delegaciones bajo tu responsabilidad"
      description="Revisa el flujo de captura de tu región y filtra rápidamente por placas, marca o delegación."
    />
  );
}
