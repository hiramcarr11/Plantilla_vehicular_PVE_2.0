import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { api } from '../../lib/api';
import { connectSocketWithAuth, socket } from '../../lib/socket';
import { useAuth } from '../auth/auth-context';
import type {
  RecordFieldCatalogMap,
  Region,
  RecordFormValues,
  VehicleRecord,
  VehicleRosterReport,
} from '../../types';

export function useCapturistData() {
  const { session } = useAuth();
  const [regions, setRegions] = useState<Region[]>([]);
  const [records, setRecords] = useState<VehicleRecord[]>([]);
  const [rosterReports, setRosterReports] = useState<VehicleRosterReport[]>([]);
  const [fieldCatalogs, setFieldCatalogs] = useState<RecordFieldCatalogMap | null>(null);

  useEffect(() => {
    if (!session) {
      return;
    }

    void Promise.all([
      api.getRegions(session.accessToken),
      api.getMyRecords(session.accessToken),
      api.getMyRosterReports(session.accessToken),
      api.getRecordFieldCatalog(session.accessToken),
    ]).then(([loadedRegions, loadedRecords, loadedRosterReports, loadedFieldCatalogs]) => {
      setRegions(loadedRegions);
      setRecords(loadedRecords);
      setRosterReports(loadedRosterReports);
      setFieldCatalogs(loadedFieldCatalogs);
    });

    connectSocketWithAuth();

    const onCreated = (record: VehicleRecord) => {
      if (record.createdBy.id === session.user.id) {
        setRecords((current) =>
          current.some((currentRecord) => currentRecord.id === record.id)
            ? current
            : [record, ...current],
        );
      }
    };

    const onChanged = (record: VehicleRecord) => {
      setRecords((current) =>
        current.map((currentRecord) => (currentRecord.id === record.id ? record : currentRecord)),
      );
    };

    socket.on('records.created', onCreated);
    socket.on('records.changed', onChanged);

    return () => {
      socket.off('records.created', onCreated);
      socket.off('records.changed', onChanged);
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
  const latestRosterReport = rosterReports[0];

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

  const updateRecord = async (recordId: string, values: RecordFormValues) => {
    if (!session) {
      return;
    }

    const confirmation = await Swal.fire({
      icon: 'question',
      title: 'Confirmar ediciÃ³n',
      text: 'Se guardarÃ¡n los cambios y quedarÃ¡ marca en bitÃ¡cora.',
      showCancelButton: true,
      confirmButtonText: 'Guardar cambios',
      cancelButtonText: 'Cancelar',
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    try {
      const record = await api.updateRecord(recordId, values, session.accessToken);
      setRecords((current) =>
        current.map((currentRecord) => (currentRecord.id === record.id ? record : currentRecord)),
      );

      await Swal.fire({
        icon: 'success',
        title: 'Captura actualizada',
        text: 'Los cambios se guardaron correctamente.',
        confirmButtonText: 'Entendido',
      });
    } catch (requestError) {
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo actualizar la captura',
        text: (requestError as Error).message,
        confirmButtonText: 'Entendido',
      });
    }
  };

  const submitRosterReport = async () => {
    if (!session) {
      return;
    }

    const confirmation = await Swal.fire({
      icon: 'question',
      title: 'Enviar reporte de plantilla',
      text: 'Se confirmarÃ¡ el estado actual de la plantilla vehicular de tu delegaciÃ³n.',
      input: 'textarea',
      inputPlaceholder: 'Observaciones opcionales',
      showCancelButton: true,
      confirmButtonText: 'Enviar reporte',
      cancelButtonText: 'Cancelar',
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    try {
      const report = await api.submitRosterReport(
        typeof confirmation.value === 'string' ? confirmation.value : '',
        session.accessToken,
      );

      setRosterReports((current) => [report, ...current]);

      await Swal.fire({
        icon: 'success',
        title: report.hasChanges ? 'Reporte enviado con cambios' : 'Reporte enviado sin cambios',
        text: `Movimientos detectados desde el Ãºltimo reporte: ${report.changesSinceLastReport}.`,
        confirmButtonText: 'Entendido',
      });
    } catch (requestError) {
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo enviar el reporte',
        text: (requestError as Error).message,
        confirmButtonText: 'Entendido',
      });
    }
  };

  return {
    session,
    records,
    rosterReports,
    latestRecord,
    latestRosterReport,
    availableDelegations,
    fieldCatalogs,
    createRecord,
    updateRecord,
    submitRosterReport,
  };
}
