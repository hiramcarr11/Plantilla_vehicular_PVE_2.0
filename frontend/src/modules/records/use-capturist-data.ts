import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { api } from '../../lib/api';
import { socket } from '../../lib/socket';
import { useAuth } from '../auth/auth-context';
import type { RecordFieldCatalogMap, Region, RecordFormValues, VehicleRecord } from '../../types';

export function useCapturistData() {
  const { session } = useAuth();
  const [regions, setRegions] = useState<Region[]>([]);
  const [records, setRecords] = useState<VehicleRecord[]>([]);
  const [fieldCatalogs, setFieldCatalogs] = useState<RecordFieldCatalogMap | null>(null);

  useEffect(() => {
    if (!session) {
      return;
    }

    void Promise.all([
      api.getRegions(session.accessToken),
      api.getMyRecords(session.accessToken),
      api.getRecordFieldCatalog(session.accessToken),
    ]).then(([loadedRegions, loadedRecords, loadedFieldCatalogs]) => {
      setRegions(loadedRegions);
      setRecords(loadedRecords);
      setFieldCatalogs(loadedFieldCatalogs);
    });

    socket.connect();

    const onCreated = (record: VehicleRecord) => {
      if (record.createdBy.id === session.user.id) {
        setRecords((current) => [record, ...current]);
      }
    };

    socket.on('records.created', onCreated);

    return () => {
      socket.off('records.created', onCreated);
      socket.disconnect();
    };
  }, [session]);

  const availableDelegations = useMemo(
    () =>
      regions
        .flatMap((region) => region.delegations)
        .filter((delegation) => delegation.id === session?.user.delegation?.id) ?? [],
    [regions, session],
  );

  const latestRecord = records[0];

  const createRecord = async (values: RecordFormValues) => {
    if (!session) {
      return;
    }

    const confirmation = await Swal.fire({
      icon: 'question',
      title: 'Confirmar guardado',
      text: 'Se registrará una nueva captura vehicular.',
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    try {
      const record = await api.createRecord(values, session.accessToken);
      setRecords((current) => [record, ...current]);

      await Swal.fire({
        icon: 'success',
        title: 'Captura guardada',
        text: 'El registro se guardó correctamente.',
        confirmButtonText: 'Entendido',
      });
    } catch (requestError) {
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo guardar la captura',
        text: (requestError as Error).message,
        confirmButtonText: 'Entendido',
      });
    }
  };

  return {
    session,
    records,
    latestRecord,
    availableDelegations,
    fieldCatalogs,
    createRecord,
  };
}
