export type Role = 'capturist' | 'regional_manager' | 'admin' | 'superadmin';
export type RecordCatalogField =
  | 'useType'
  | 'vehicleClass'
  | 'physicalStatus'
  | 'status'
  | 'assetClassification';

export type CatalogOption = {
  value: string;
  label: string;
};

export type RecordFieldCatalog = {
  label: string;
  allowsCustom: boolean;
  options: CatalogOption[];
};

export type RecordFieldCatalogMap = Record<RecordCatalogField, RecordFieldCatalog>;

export type Region = {
  id: string;
  name: string;
  code: string;
  delegations: Delegation[];
};

export type Delegation = {
  id: string;
  name: string;
};

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  grade: string;
  phone: string;
  email: string;
  role: Role;
  region?: Region | null;
  delegation?: Delegation | null;
};

export type CreateUserPayload = {
  firstName: string;
  lastName: string;
  grade: string;
  email: string;
  password: string;
  role: Role;
  phone: string;
  regionId?: string;
  delegationId?: string;
};

export type RecordFormValues = {
  delegationId: string;
  plates: string;
  brand: string;
  type: string;
  useType: string;
  vehicleClass: string;
  model: string;
  engineNumber: string;
  serialNumber: string;
  custodian: string;
  patrolNumber: string;
  physicalStatus: string;
  status: string;
  assetClassification: string;
  observation: string;
};

export type VehicleRecord = RecordFormValues & {
  id: string;
  createdAt: string;
  delegation: {
    id: string;
    name: string;
    region: {
      id: string;
      name: string;
    };
  };
  createdBy: User;
};

export type GroupedRegionRecords = {
  regionId: string;
  regionName: string;
  delegations: {
    delegationId: string;
    delegationName: string;
    records: VehicleRecord[];
  }[];
};

export type AuditLog = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  actor?: User | null;
};

export type AuthResponse = {
  accessToken: string;
  user: User;
};
