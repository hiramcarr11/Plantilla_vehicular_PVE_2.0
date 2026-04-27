export const RECORD_FIELD_CATALOG = {
  useType: {
    label: 'Uso',
    allowsCustom: true,
    options: [
      { value: 'PATRULLA', label: 'PATRULLA' },
      { value: 'PARTICULAR', label: 'PARTICULAR' },
      { value: 'OTRO', label: 'OTRO' },
    ],
  },
  vehicleClass: {
    label: 'Clase de vehículo',
    allowsCustom: false,
    options: [
      { value: 'SEDAN', label: 'SEDAN' },
      { value: 'PICK UP', label: 'PICK UP' },
      { value: 'MOTOCICLETA', label: 'MOTOCICLETA' },
      { value: 'GRUA', label: 'GRUA' },
      { value: 'BICICLETA', label: 'BICICLETA' },
      { value: 'MICROBUS', label: 'MICROBUS' },
    ],
  },
  physicalStatus: {
    label: 'Estado físico',
    allowsCustom: false,
    options: [
      { value: 'BUENO', label: 'BUENO' },
      { value: 'REGULAR', label: 'REGULAR' },
      { value: 'MALO', label: 'MALO' },
    ],
  },
  status: {
    label: 'Estatus',
    allowsCustom: true,
    options: [
      { value: 'ACTIVO', label: 'ACTIVO' },
      { value: 'INCATIVO', label: 'INCATIVO' },
      { value: 'SINIESTRADO', label: 'SINIESTRADO' },
      { value: 'PARA BAJA', label: 'PARA BAJA' },
      { value: 'OTRO', label: 'OTRO' },
    ],
  },
  assetClassification: {
    label: 'Clasificación del bien',
    allowsCustom: true,
    options: [
      { value: 'PATRIMONIAL', label: 'PATRIMONIAL' },
      { value: 'ARRENDAMIENTO', label: 'ARRENDAMIENTO' },
      { value: 'OTRO', label: 'OTRO' },
    ],
  },
} as const;
