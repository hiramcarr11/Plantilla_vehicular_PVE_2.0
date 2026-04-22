import {
  AuditLog,
  AuthResponse,
  CreateUserPayload,
  GroupedRegionRecords,
  RecordFieldCatalogMap,
  RecordFormValues,
  Region,
  User,
  VehicleRecord,
} from '../types';

function resolveApiUrl() {
  const configuredApiUrl = import.meta.env.VITE_API_URL;

  if (configuredApiUrl) {
    return configuredApiUrl;
  }

  if (typeof window === 'undefined') {
    return 'http://localhost:3000/api';
  }

  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:3000/api`;
}

const API_URL = resolveApiUrl();

async function request<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Request failed.');
  }

  return response.json() as Promise<T>;
}

export const api = {
  login(email: string, password: string) {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  getRegions(token: string) {
    return request<Region[]>('/catalog/regions', undefined, token);
  },
  getRecordFieldCatalog(token: string) {
    return request<RecordFieldCatalogMap>('/catalog/record-fields', undefined, token);
  },
  createRecord(values: RecordFormValues, token: string) {
    return request<VehicleRecord>('/records', {
      method: 'POST',
      body: JSON.stringify(values),
    }, token);
  },
  getMyRecords(token: string) {
    return request<VehicleRecord[]>('/records/my', undefined, token);
  },
  getRegionalOverview(token: string) {
    return request<GroupedRegionRecords[]>('/records/region/live', undefined, token);
  },
  getAdminOverview(token: string) {
    return request<GroupedRegionRecords[]>('/records/admin/overview', undefined, token);
  },
  getUsers(token: string) {
    return request<User[]>('/users', undefined, token);
  },
  createUser(payload: CreateUserPayload, token: string) {
    return request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token);
  },
  getAuditLogs(token: string) {
    return request<AuditLog[]>('/audit-logs/live', undefined, token);
  },
};
