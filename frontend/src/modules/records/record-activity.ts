import Swal from 'sweetalert2';
import { api } from '../../lib/api';
import { formatUserName } from '../../lib/format-user-name';
import type { Region, VehicleEditEvent, VehicleRecord, VehicleTransferEvent } from '../../types';

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderTransferLine(transfer: VehicleTransferEvent) {
  return `
    <div class="activity-item">
      <div class="activity-item-head">
        <strong>${escapeHtml(transfer.fromDelegation.name)} -> ${escapeHtml(transfer.toDelegation.name)}</strong>
        <span>${new Date(transfer.movedAt).toLocaleString()}</span>
      </div>
      <p>Hecho por ${escapeHtml(formatUserName(transfer.movedBy))}.</p>
      <span>${escapeHtml(transfer.reason || 'Sin motivo registrado.')}</span>
    </div>
  `;
}

function renderEditLine(edit: VehicleEditEvent) {
  const changes =
    edit.changedFields.length > 0
      ? edit.changedFields
          .map((fieldName) => {
            const beforeValue = escapeHtml(edit.before[fieldName] ?? '-');
            const afterValue = escapeHtml(edit.after[fieldName] ?? '-');
            return `<div><strong>${escapeHtml(fieldName)}</strong>: ${beforeValue} -> ${afterValue}</div>`;
          })
          .join('')
      : '<div>Sin detalle de cambios.</div>';

  return `
    <div class="activity-item">
      <div class="activity-item-head">
        <strong>Edicion registrada</strong>
        <span>${new Date(edit.editedAt).toLocaleString()}</span>
      </div>
      <p>Hecho por ${escapeHtml(
        edit.actor ? formatUserName(edit.actor) : 'Usuario no disponible',
      )}.</p>
      <span>${changes}</span>
    </div>
  `;
}

export function getRecordActivitySummary(record: VehicleRecord) {
  const parts = [];

  if (record.recordState === 'TRANSFERRED_OUT' && record.latestTransfer) {
    parts.push(`Trasladado a ${record.latestTransfer.toDelegation.name}`);
  } else if (record.latestTransfer) {
    parts.push(`Recibido desde ${record.latestTransfer.fromDelegation.name}`);
  }

  if (record.latestEdit) {
    parts.push(`Editado el ${new Date(record.latestEdit.editedAt).toLocaleDateString()}`);
  }

  return parts.length > 0 ? parts.join(' · ') : 'Sin movimientos recientes';
}

export async function openRecordDetails(record: VehicleRecord) {
  const transferHistory =
    record.transferHistory.length > 0
      ? record.transferHistory.map((transfer) => renderTransferLine(transfer)).join('')
      : '<div class="activity-item"><span>Sin traslados registrados.</span></div>';
  const editHistory =
    record.editHistory.length > 0
      ? record.editHistory.map((edit) => renderEditLine(edit)).join('')
      : '<div class="activity-item"><span>Sin ediciones registradas.</span></div>';

  await Swal.fire({
    title: `Historial de ${record.plates}`,
    width: 900,
    confirmButtonText: 'Cerrar',
    html: `
      <div class="activity-list">
        <div class="activity-item">
          <div class="activity-item-head">
            <strong>Estado actual</strong>
            <span>${escapeHtml(record.recordState === 'CURRENT' ? 'Vigente en la delegacion' : 'Trasladado')}</span>
          </div>
          <p>Delegacion visible: ${escapeHtml(record.viewDelegation.name)}</p>
          <span>Delegacion actual: ${escapeHtml(record.delegation.name)}</span>
        </div>
        ${transferHistory}
        ${editHistory}
      </div>
    `,
  });
}

export async function openTransferDialog(params: {
  record: VehicleRecord;
  regions: Region[];
  token: string;
  onTransferred: () => Promise<void> | void;
}) {
  const delegationOptions = Object.fromEntries(
    params.regions
      .flatMap((region) =>
        region.delegations.map((delegation) => [
          delegation.id,
          `${region.name} - ${delegation.name}`,
        ]),
      )
      .filter(([delegationId]) => delegationId !== params.record.delegation.id),
  );

  const targetConfirmation = await Swal.fire({
    icon: 'question',
    title: 'Trasladar vehiculo',
    text: `Selecciona la nueva delegacion para ${params.record.plates}.`,
    input: 'select',
    inputOptions: delegationOptions,
    inputPlaceholder: 'Selecciona una delegacion',
    showCancelButton: true,
    confirmButtonText: 'Continuar',
    cancelButtonText: 'Cancelar',
    inputValidator: (value) => (!value ? 'Selecciona una delegacion.' : null),
  });

  if (!targetConfirmation.isConfirmed || typeof targetConfirmation.value !== 'string') {
    return false;
  }

  const reasonConfirmation = await Swal.fire({
    icon: 'question',
    title: 'Motivo del traslado',
    input: 'textarea',
    inputPlaceholder: 'Captura el motivo del traslado',
    showCancelButton: true,
    confirmButtonText: 'Registrar traslado',
    cancelButtonText: 'Cancelar',
    inputValidator: (value) => (!value.trim() ? 'Captura el motivo.' : null),
  });

  if (!reasonConfirmation.isConfirmed || typeof reasonConfirmation.value !== 'string') {
    return false;
  }

  await api.transferRecord(
    params.record.id,
    targetConfirmation.value,
    reasonConfirmation.value,
    params.token,
  );

  await params.onTransferred();
  return true;
}
