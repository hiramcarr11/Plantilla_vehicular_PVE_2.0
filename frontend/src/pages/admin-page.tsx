import { useEffect, useState } from 'react';
import { GroupedRecords } from '../components/grouped-records';
import { api } from '../lib/api';
import { socket } from '../lib/socket';
import { useAuth } from '../modules/auth/auth-context';
import type { GroupedRegionRecords, RecordFieldCatalogMap } from '../types';

export function AdminPage() {
  const { session } = useAuth();
  const [regions, setRegions] = useState<GroupedRegionRecords[]>([]);
  const [fieldCatalogs, setFieldCatalogs] = useState<RecordFieldCatalogMap | null>(null);

  useEffect(() => {
    if (!session) {
      return;
    }

    const refresh = async () => {
      const [loadedRegions, loadedFieldCatalogs] = await Promise.all([
        api.getAdminOverview(session.accessToken),
        api.getRecordFieldCatalog(session.accessToken),
      ]);

      setRegions(loadedRegions);
      setFieldCatalogs(loadedFieldCatalogs);
    };

    void refresh();
    socket.connect();
    socket.on('records.created', refresh);

    return () => {
      socket.off('records.created', refresh);
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
      eyebrow="Vista global"
      title="Operación completa del sistema"
      description="Supervisa la captura de todas las regiones y detecta concentración operativa por delegación."
    />
  );
}
