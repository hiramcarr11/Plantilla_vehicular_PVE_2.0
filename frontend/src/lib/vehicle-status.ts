export function resolveVehicleStatusTone(status: string): string {
  const normalizedStatus = status.trim().toUpperCase();

  if (normalizedStatus === 'ACTIVO') return 'is-success';
  if (normalizedStatus === 'INACTIVO' || normalizedStatus === 'INCATIVO') return 'is-muted';
  if (normalizedStatus === 'SINIESTRADO') return 'is-danger';
  if (normalizedStatus === 'PARA BAJA') return 'is-warning';
  if (normalizedStatus === 'OTRO') return 'is-info';

  return 'is-neutral';
}
