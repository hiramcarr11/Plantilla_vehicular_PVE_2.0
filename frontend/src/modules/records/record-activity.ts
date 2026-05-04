import Swal from "sweetalert2";
import { api } from "../../lib/api";
import { formatUserName } from "../../lib/format-user-name";
import { resolveConfiguredNetworkUrl } from "../../lib/resolve-network-url";
import type {
  Region,
  VehicleEditEvent,
  VehiclePhoto,
  VehicleRecord,
  VehicleTransferEvent,
} from "../../types";

function resolveApiBaseUrl() {
  const configuredUrl = resolveConfiguredNetworkUrl(
    import.meta.env.VITE_API_URL,
    "/api",
  );

  if (configuredUrl) {
    return configuredUrl.replace(/\/api$/, "");
  }

  if (typeof window === "undefined") {
    return "http://localhost:3101";
  }

  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:3101`;
}

const API_BASE_URL = resolveApiBaseUrl();

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderTransferLine(transfer: VehicleTransferEvent) {
  return `
    <div class="activity-item">
      <div class="activity-item-head">
        <strong>${escapeHtml(transfer.fromDelegation.name)} -> ${escapeHtml(
          transfer.toDelegation.name,
        )}</strong>
        <span>${new Date(transfer.movedAt).toLocaleString()}</span>
      </div>
      <p>Hecho por ${escapeHtml(formatUserName(transfer.movedBy))}.</p>
      <span>${escapeHtml(transfer.reason || "Sin motivo registrado.")}</span>
    </div>
  `;
}

function renderEditLine(edit: VehicleEditEvent) {
  const changes =
    edit.changedFields.length > 0
      ? edit.changedFields
          .map((fieldName) => {
            const beforeValue = escapeHtml(edit.before[fieldName] ?? "-");
            const afterValue = escapeHtml(edit.after[fieldName] ?? "-");

            return `<div><strong>${escapeHtml(
              fieldName,
            )}</strong>: ${beforeValue} -> ${afterValue}</div>`;
          })
          .join("")
      : "<div>Sin detalle de cambios.</div>";

  return `
    <div class="activity-item">
      <div class="activity-item-head">
        <strong>Edicion registrada</strong>
        <span>${new Date(edit.editedAt).toLocaleString()}</span>
      </div>
      <p>Hecho por ${escapeHtml(
        edit.actor ? formatUserName(edit.actor) : "Usuario no disponible",
      )}.</p>
      <span>${changes}</span>
    </div>
  `;
}

function joinUrl(base: string, path: string) {
  const cleanedBase = base.replace(/\/+$/, "");
  const cleanedPath = path.replace(/^\/+/, "");
  return `${cleanedBase}/${cleanedPath}`;
}

function resolvePhotoUrl(photo: VehiclePhoto) {
  const publicUrl = photo.publicUrl?.trim();
  const objectKey = photo.objectKey?.trim();
  const filePath = photo.filePath?.trim();

  if (publicUrl) {
    if (
      publicUrl.startsWith("http://") ||
      publicUrl.startsWith("https://")
    ) {
      return publicUrl;
    }

    if (publicUrl.startsWith("/uploads/")) {
      // Legacy/local files may no longer exist after stateless redeploys.
      return joinUrl(API_BASE_URL, publicUrl);
    }

    if (
      !publicUrl.includes("/") &&
      (publicUrl.includes(".") || publicUrl.length > 0)
    ) {
      return joinUrl(API_BASE_URL, `/uploads/vehicle-photos/${publicUrl}`);
    }

    if (publicUrl.startsWith("/")) {
      return joinUrl(API_BASE_URL, publicUrl);
    }

    return joinUrl(API_BASE_URL, `/uploads/vehicle-photos/${publicUrl}`);
  }

  if (objectKey) {
    return joinUrl(API_BASE_URL, `/uploads/${objectKey}`);
  }

  if (filePath) {
    return joinUrl(API_BASE_URL, `/uploads/vehicle-photos/${filePath}`);
  }

  return "";
}

function renderPhotoThumbnail(photo: VehiclePhoto) {
  const photoUrl = escapeHtml(resolvePhotoUrl(photo));
  const photoName = escapeHtml(photo.fileName);

  return `
    <div class="photo-thumb" data-photo-url="${photoUrl}" data-photo-name="${photoName}">
      <img src="${photoUrl}" alt="${photoName}" onerror="this.style.display='none';this.nextElementSibling.style.display='grid';" />
      <div class="photo-fallback" style="display:none;">Imagen no disponible</div>
    </div>
  `;
}

export function getRecordActivitySummary(record: VehicleRecord) {
  const parts = [];

  if (record.recordState === "TRANSFERRED_OUT" && record.latestTransfer) {
    parts.push(`Trasladado a ${record.latestTransfer.toDelegation.name}`);
  } else if (record.latestTransfer) {
    parts.push(`Recibido desde ${record.latestTransfer.fromDelegation.name}`);
  }

  if (record.latestEdit) {
    parts.push(
      `Editado el ${new Date(record.latestEdit.editedAt).toLocaleDateString()}`,
    );
  }

  return parts.length > 0 ? parts.join(" · ") : "Sin movimientos recientes";
}

export async function openRecordDetails(record: VehicleRecord) {
  const vehicleSummarySection = `
    <div class="activity-item vehicle-detail-summary">
      <div class="activity-item-head">
        <strong>Datos del vehículo</strong>
        <span>${escapeHtml(record.plates || "-")}</span>
      </div>
      <div class="vehicle-detail-grid">
        <div class="vehicle-detail-field">
          <span>Placas</span>
          <strong>${escapeHtml(record.plates || "-")}</strong>
        </div>
        <div class="vehicle-detail-field">
          <span>Clase</span>
          <strong>${escapeHtml(record.vehicleClass || "-")}</strong>
        </div>
        <div class="vehicle-detail-field">
          <span>Uso</span>
          <strong>${escapeHtml(record.useType || "-")}</strong>
        </div>
        <div class="vehicle-detail-field">
          <span>Marca</span>
          <strong>${escapeHtml(record.brand || "-")}</strong>
        </div>
        <div class="vehicle-detail-field">
          <span>Tipo</span>
          <strong>${escapeHtml(record.type || "-")}</strong>
        </div>
        <div class="vehicle-detail-field">
          <span>Modelo</span>
          <strong>${escapeHtml(record.model || "-")}</strong>
        </div>
        <div class="vehicle-detail-field">
          <span>Número de motor</span>
          <strong>${escapeHtml(record.engineNumber || "-")}</strong>
        </div>
        <div class="vehicle-detail-field">
          <span>Número de serie</span>
          <strong>${escapeHtml(record.serialNumber || "-")}</strong>
        </div>
        <div class="vehicle-detail-field">
          <span>Resguardante</span>
          <strong>${escapeHtml(record.custodian || "-")}</strong>
        </div>
        <div class="vehicle-detail-field">
          <span>Estado físico</span>
          <strong>${escapeHtml(record.physicalStatus || "-")}</strong>
        </div>
        <div class="vehicle-detail-field">
          <span>Estatus</span>
          <strong>${escapeHtml(record.status || "-")}</strong>
        </div>
        <div class="vehicle-detail-field">
          <span>Clasificación del bien</span>
          <strong>${escapeHtml(record.assetClassification || "-")}</strong>
        </div>
        <div class="vehicle-detail-field">
          <span>Delegación actual</span>
          <strong>${escapeHtml(record.delegation.name || "-")}</strong>
        </div>
      </div>
    </div>
  `;

  const transferHistory =
    record.transferHistory.length > 0
      ? record.transferHistory
          .map((transfer) => renderTransferLine(transfer))
          .join("")
      : '<div class="activity-item"><span>Sin traslados registrados.</span></div>';

  const editHistory =
    record.editHistory.length > 0
      ? record.editHistory.map((edit) => renderEditLine(edit)).join("")
      : '<div class="activity-item"><span>Sin ediciones registradas.</span></div>';

  const photosSection =
    record.photos && record.photos.length > 0
      ? `
        <div class="activity-item">
          <div class="activity-item-head">
            <strong>Fotos</strong>
            <span>${record.photos.length} imagen(es)</span>
          </div>
          <div class="photo-gallery">
            ${record.photos.map((photo) => renderPhotoThumbnail(photo)).join("")}
          </div>
        </div>
      `
      : '<div class="activity-item"><span>Sin fotos cargadas.</span></div>';

  await Swal.fire({
    title: `Historial de ${escapeHtml(record.plates)}`,
    width: 900,
    confirmButtonText: "Cerrar",
    html: `
      <div class="activity-list">
        ${vehicleSummarySection}

        <div class="activity-item">
          <div class="activity-item-head">
            <strong>Estado actual</strong>
            <span>${escapeHtml(
              record.recordState === "CURRENT"
                ? "Vigente en la delegacion"
                : "Trasladado",
            )}</span>
          </div>
          <p>Delegacion visible: ${escapeHtml(record.viewDelegation.name)}</p>
          <span>Delegacion actual: ${escapeHtml(record.delegation.name)}</span>
        </div>

        ${photosSection}

        <div class="activity-item">
          <div class="activity-item-head">
            <strong>Historial de traslados</strong>
          </div>
          <div class="activity-list">
            ${transferHistory}
          </div>
        </div>

        <div class="activity-item">
          <div class="activity-item-head">
            <strong>Historial de ediciones</strong>
          </div>
          <div class="activity-list">
            ${editHistory}
          </div>
        </div>
      </div>
    `,
    didOpen: () => {
      const popup = Swal.getPopup();

      if (!popup) {
        return;
      }

      popup.querySelectorAll(".photo-thumb").forEach((thumb) => {
        thumb.addEventListener("click", () => {
          const photoUrl = (thumb as HTMLElement).getAttribute(
            "data-photo-url",
          );
          const photoName = (thumb as HTMLElement).getAttribute(
            "data-photo-name",
          );

          if (!photoUrl) {
            return;
          }

          void Swal.fire({
            imageUrl: photoUrl,
            imageAlt: photoName ?? "Foto del vehiculo",
            showConfirmButton: false,
            showCloseButton: true,
            width: "90%",
          });
        });
      });
    },
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
    icon: "question",
    title: "Trasladar vehiculo",
    text: `Selecciona la nueva delegacion para ${params.record.plates}.`,
    input: "select",
    inputOptions: delegationOptions,
    inputPlaceholder: "Selecciona una delegacion",
    showCancelButton: true,
    confirmButtonText: "Continuar",
    cancelButtonText: "Cancelar",
    inputValidator: (value) => (!value ? "Selecciona una delegacion." : null),
  });

  if (
    !targetConfirmation.isConfirmed ||
    typeof targetConfirmation.value !== "string"
  ) {
    return false;
  }

  const reasonConfirmation = await Swal.fire({
    icon: "question",
    title: "Motivo del traslado",
    input: "textarea",
    inputPlaceholder: "Captura el motivo del traslado",
    showCancelButton: true,
    confirmButtonText: "Registrar traslado",
    cancelButtonText: "Cancelar",
    inputValidator: (value) => (!value.trim() ? "Captura el motivo." : null),
  });

  if (
    !reasonConfirmation.isConfirmed ||
    typeof reasonConfirmation.value !== "string"
  ) {
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
