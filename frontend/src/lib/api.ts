import {
  AuditLog,
  AuthResponse,
  CreateUserPayload,
  DirectorOverview,
  GroupedRegionRecords,
  RecordFieldCatalogMap,
  RecordFormValues,
  Region,
  UpdateUserPayload,
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

function getPublicErrorMessage(status: number) {
  if (status === 401) {
    return 'No autorizado. Inicia sesión nuevamente.';
  }

  if (status === 403) {
    return 'No tienes permisos para realizar esta acción.';
  }

  if (status === 404) {
    return 'El recurso solicitado no fue encontrado.';
  }

  if (status === 429) {
    return 'Demasiadas solicitudes. Intenta más tarde.';
  }

  if (status >= 500) {
    return 'Ocurrió un error interno. Intenta nuevamente más tarde.';
  }

  return 'No se pudo completar la solicitud.';
}

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
    throw new Error(getPublicErrorMessage(response.status));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const responseText = await response.text();

  if (!responseText.trim()) {
    return undefined as T;
  }

  return JSON.parse(responseText) as T;
}

export const api = {
  login(email: string, password: string) {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  getCurrentUser(token: string) {
    return request<User>('/auth/me', undefined, token);
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
  getAdminOverview(
    token: string,
    regionId?: string,
    delegationId?: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    const params = new URLSearchParams();

    if (regionId) {
      params.set('regionId', regionId);
    }

    if (delegationId) {
      params.set('delegationId', delegationId);
    }

    if (dateFrom) {
      params.set('dateFrom', dateFrom);
    }

    if (dateTo) {
      params.set('dateTo', dateTo);
    }

    const query = params.toString();
    const path = query ? `/records/admin/overview?${query}` : '/records/admin/overview';

    return request<GroupedRegionRecords[]>(path, undefined, token);
  },
  getDirectorOverview(
    token: string,
    regionId?: string,
    delegationId?: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    const params = new URLSearchParams();

    if (regionId) {
      params.set('regionId', regionId);
    }

    if (delegationId) {
      params.set('delegationId', delegationId);
    }

    if (dateFrom) {
      params.set('dateFrom', dateFrom);
    }

    if (dateTo) {
      params.set('dateTo', dateTo);
    }

    const query = params.toString();
    const path = query ? `/records/director/overview?${query}` : '/records/director/overview';

    return request<DirectorOverview>(path, undefined, token);
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
  updateUser(userId: string, payload: UpdateUserPayload, token: string) {
    return request<User>(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }, token);
  },
  deleteUser(userId: string, token: string) {
    return request<void>(`/users/${userId}`, {
      method: 'DELETE',
    }, token);
  },
  getAuditLogs(token: string) {
    return request<AuditLog[]>('/audit-logs/live', undefined, token);
  },
};
