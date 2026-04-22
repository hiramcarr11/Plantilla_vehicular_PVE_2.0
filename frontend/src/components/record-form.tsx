import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { Delegation, RecordFieldCatalogMap, RecordFormValues } from '../types';

const customCatalogFields = ['useType', 'status', 'assetClassification'] as const;

const schema = z
  .object({
    delegationId: z.string().min(1),
    plates: z.string().min(1),
    brand: z.string().min(1),
    type: z.string().min(1),
    useType: z.string().min(1),
    useTypeCustom: z.string().optional(),
    vehicleClass: z.string().min(1),
    model: z.string().min(1),
    engineNumber: z.string().min(1),
    serialNumber: z.string().min(1),
    custodian: z.string().min(1),
    patrolNumber: z.string().min(1),
    physicalStatus: z.string().min(1),
    status: z.string().min(1),
    statusCustom: z.string().optional(),
    assetClassification: z.string().min(1),
    assetClassificationCustom: z.string().optional(),
    observation: z.string(),
  })
  .superRefine((values, context) => {
    for (const fieldName of customCatalogFields) {
      const customFieldName = `${fieldName}Custom` as const;

      if (values[fieldName] === 'OTRO' && !values[customFieldName]?.trim()) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Captura el valor personalizado.',
          path: [customFieldName],
        });
      }
    }
  });

type RecordFormData = z.infer<typeof schema>;

type RecordFormProps = {
  delegations: Delegation[];
  fieldCatalogs: RecordFieldCatalogMap;
  onSubmit: (values: RecordFormValues) => Promise<void>;
};

const textFields = [
  ['plates', 'Placas'],
  ['brand', 'Marca'],
  ['type', 'Tipo'],
  ['model', 'Modelo'],
  ['engineNumber', 'No. de motor'],
  ['serialNumber', 'No. de serie'],
  ['custodian', 'Resguardante'],
  ['patrolNumber', 'No. patrulla'],
] as const;

const catalogFields = [
  ['useType', 'Uso'],
  ['vehicleClass', 'Clase de vehículo'],
  ['physicalStatus', 'Estado físico'],
  ['status', 'Estatus'],
  ['assetClassification', 'Clasificación del bien'],
] as const;

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeUpper(value: string) {
  return normalizeText(value).toUpperCase();
}

function normalizeCatalogValue(
  selectedValue: string,
  customValue: string | undefined,
  allowsCustom: boolean,
) {
  if (allowsCustom && selectedValue === 'OTRO') {
    return normalizeUpper(customValue ?? '');
  }

  return normalizeUpper(selectedValue);
}

export function RecordForm({ delegations, fieldCatalogs, onSubmit }: RecordFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RecordFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      delegationId: '',
      plates: '',
      brand: '',
      type: '',
      useType: '',
      useTypeCustom: '',
      vehicleClass: '',
      model: '',
      engineNumber: '',
      serialNumber: '',
      custodian: '',
      patrolNumber: '',
      physicalStatus: '',
      status: '',
      statusCustom: '',
      assetClassification: '',
      assetClassificationCustom: '',
      observation: '',
    },
  });

  const selectedUseType = watch('useType');
  const selectedStatus = watch('status');
  const selectedAssetClassification = watch('assetClassification');

  return (
    <form
      className="panel stack-md"
      onSubmit={handleSubmit(async (values) => {
        await onSubmit({
          delegationId: values.delegationId,
          plates: normalizeUpper(values.plates),
          brand: normalizeUpper(values.brand),
          type: normalizeUpper(values.type),
          useType: normalizeCatalogValue(
            values.useType,
            values.useTypeCustom,
            fieldCatalogs.useType.allowsCustom,
          ),
          vehicleClass: normalizeUpper(values.vehicleClass),
          model: normalizeUpper(values.model),
          engineNumber: normalizeUpper(values.engineNumber),
          serialNumber: normalizeUpper(values.serialNumber),
          custodian: normalizeUpper(values.custodian),
          patrolNumber: normalizeUpper(values.patrolNumber),
          physicalStatus: normalizeUpper(values.physicalStatus),
          status: normalizeCatalogValue(
            values.status,
            values.statusCustom,
            fieldCatalogs.status.allowsCustom,
          ),
          assetClassification: normalizeCatalogValue(
            values.assetClassification,
            values.assetClassificationCustom,
            fieldCatalogs.assetClassification.allowsCustom,
          ),
          observation: normalizeText(values.observation),
        });

        reset();
      })}
    >
      <div className="panel-header">
        <div>
          <p className="eyebrow">Formulario</p>
          <h2>Nueva captura</h2>
        </div>
      </div>

      <label className="field">
        <span>Delegación</span>
        <select {...register('delegationId')}>
          <option value="">Selecciona una delegación</option>
          {delegations.map((delegation) => (
            <option key={delegation.id} value={delegation.id}>
              {delegation.name}
            </option>
          ))}
        </select>
        {errors.delegationId && <small>{errors.delegationId.message}</small>}
      </label>

      <div className="form-grid">
        {textFields.map(([fieldName, label]) => (
          <label className="field" key={fieldName}>
            <span>{label}</span>
            <input {...register(fieldName)} />
            {errors[fieldName] && <small>{errors[fieldName]?.message}</small>}
          </label>
        ))}

        {catalogFields.map(([fieldName, fallbackLabel]) => {
          const catalog = fieldCatalogs[fieldName];
          const customFieldName = `${fieldName}Custom` as
            | 'useTypeCustom'
            | 'statusCustom'
            | 'assetClassificationCustom';
          const selectedValue =
            fieldName === 'useType'
              ? selectedUseType
              : fieldName === 'status'
                ? selectedStatus
                : fieldName === 'assetClassification'
                  ? selectedAssetClassification
                  : '';

          return (
            <div className="field" key={fieldName}>
              <span>{catalog?.label ?? fallbackLabel}</span>
              <select {...register(fieldName)}>
                <option value="">Selecciona una opción</option>
                {catalog.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors[fieldName] && <small>{errors[fieldName]?.message}</small>}

              {catalog.allowsCustom && selectedValue === 'OTRO' && (
                <>
                  <input
                    placeholder={`Especifica ${catalog.label.toLowerCase()}`}
                    {...register(customFieldName)}
                  />
                  {errors[customFieldName] && <small>{errors[customFieldName]?.message}</small>}
                </>
              )}
            </div>
          );
        })}

        <label className="field field-full">
          <span>Observación</span>
          <textarea rows={4} {...register('observation')} />
        </label>
      </div>

      <button className="primary-button" disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Guardando...' : 'Guardar captura'}
      </button>
    </form>
  );
}
