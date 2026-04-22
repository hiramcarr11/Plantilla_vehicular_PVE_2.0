import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { api } from '../lib/api';
import { useAuth } from '../modules/auth/auth-context';
import type { CreateUserPayload, Region, User } from '../types';
import { EmptyState } from '../components/empty-state';
import { PageIntro } from '../components/page-intro';
import { StatsGrid } from '../components/stats-grid';

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeUpper(value: string) {
  return normalizeText(value).toUpperCase();
}

function normalizeEmail(value: string) {
  return normalizeText(value).toLowerCase();
}

const emptyUser: CreateUserPayload = {
  firstName: '',
  lastName: '',
  grade: '',
  email: '',
  password: '',
  role: 'capturist',
  phone: '',
  regionId: undefined,
  delegationId: undefined,
};

export function SuperAdminPage() {
  const { session } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [draftUser, setDraftUser] = useState<CreateUserPayload>(emptyUser);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!session) {
      return;
    }

    const loadData = async () => {
      const [loadedUsers, loadedRegions] = await Promise.all([
        api.getUsers(session.accessToken),
        api.getRegions(session.accessToken),
      ]);

      setUsers(loadedUsers);
      setRegions(loadedRegions);
    };

    void loadData();
  }, [session]);

  if (!session) {
    return null;
  }

  const selectedRegion = regions.find((region) => region.id === draftUser.regionId);
  const availableDelegations = selectedRegion?.delegations ?? [];

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return users;
    }

    return users.filter((user) =>
      [
        user.fullName,
        user.email,
        user.grade,
        user.role,
        user.region?.name,
        user.delegation?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [search, users]);

  return (
    <div className="stack-lg">
      <section className="panel">
        <PageIntro
          eyebrow="Supervisión"
          title="Administración de usuarios"
          description="Da de alta cuentas operativas y mantén control sobre los perfiles del sistema."
          actions={
            <label className="toolbar-search">
              <span>Buscar usuario</span>
              <input
                placeholder="Nombre, correo, región o rol"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          }
        />

        <StatsGrid
          items={[
            { label: 'Usuarios activos', value: users.length },
            { label: 'Regiones cargadas', value: regions.length },
            {
              label: 'Delegaciones disponibles',
              value: regions.reduce((total, region) => total + region.delegations.length, 0),
            },
            {
              label: 'Cobertura visible',
              value: `${filteredUsers.length}`,
              helper: 'Usuarios en pantalla',
            },
          ]}
        />
      </section>

      <section className="panel stack-md">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Administración</p>
            <h2>Crear usuario</h2>
          </div>
        </div>

        <div className="form-grid">
          <label className="field">
            <span>Nombre</span>
            <input
              value={draftUser.firstName}
              onChange={(event) =>
                setDraftUser((current) => ({ ...current, firstName: event.target.value }))
              }
            />
          </label>
          <label className="field">
            <span>Apellido</span>
            <input
              value={draftUser.lastName}
              onChange={(event) =>
                setDraftUser((current) => ({ ...current, lastName: event.target.value }))
              }
            />
          </label>
          <label className="field">
            <span>Grado</span>
            <input
              value={draftUser.grade}
              onChange={(event) =>
                setDraftUser((current) => ({ ...current, grade: event.target.value }))
              }
            />
          </label>
          <label className="field">
            <span>Correo</span>
            <input
              value={draftUser.email}
              onChange={(event) =>
                setDraftUser((current) => ({ ...current, email: event.target.value }))
              }
            />
          </label>
          <label className="field">
            <span>Contraseña</span>
            <input
              type="password"
              value={draftUser.password}
              onChange={(event) =>
                setDraftUser((current) => ({ ...current, password: event.target.value }))
              }
            />
          </label>
          <label className="field">
            <span>Teléfono</span>
            <input
              value={draftUser.phone}
              onChange={(event) =>
                setDraftUser((current) => ({ ...current, phone: event.target.value }))
              }
            />
          </label>
          <label className="field">
            <span>Rol</span>
            <select
              value={draftUser.role}
              onChange={(event) =>
                setDraftUser((current) => ({
                  ...current,
                  role: event.target.value as CreateUserPayload['role'],
                }))
              }
            >
              <option value="capturist">Capturista</option>
              <option value="regional_manager">Encargado regional</option>
              <option value="admin">Administrador</option>
              <option value="superadmin">Superadministrador</option>
            </select>
          </label>
          <label className="field">
            <span>Región</span>
            <select
              value={draftUser.regionId ?? ''}
              onChange={(event) =>
                setDraftUser((current) => ({
                  ...current,
                  regionId: event.target.value || undefined,
                  delegationId: undefined,
                }))
              }
            >
              <option value="">Selecciona una región</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Delegación</span>
            <select
              value={draftUser.delegationId ?? ''}
              onChange={(event) =>
                setDraftUser((current) => ({
                  ...current,
                  delegationId: event.target.value || undefined,
                }))
              }
            >
              <option value="">Selecciona una delegación</option>
              {availableDelegations.map((delegation) => (
                <option key={delegation.id} value={delegation.id}>
                  {delegation.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          className="primary-button"
          type="button"
          onClick={async () => {
            const confirmation = await Swal.fire({
              icon: 'question',
              title: 'Confirmar alta de usuario',
              text: 'Se creará una nueva cuenta con los datos capturados.',
              showCancelButton: true,
              confirmButtonText: 'Crear usuario',
              cancelButtonText: 'Cancelar',
            });

            if (!confirmation.isConfirmed) {
              return;
            }

            try {
              await api.createUser(
                {
                  ...draftUser,
                  firstName: normalizeUpper(draftUser.firstName),
                  lastName: normalizeUpper(draftUser.lastName),
                  grade: normalizeUpper(draftUser.grade),
                  phone: normalizeText(draftUser.phone),
                  email: normalizeEmail(draftUser.email),
                  password: normalizeText(draftUser.password),
                },
                session.accessToken,
              );
              setDraftUser(emptyUser);
              setUsers(await api.getUsers(session.accessToken));

              await Swal.fire({
                icon: 'success',
                title: 'Usuario creado',
                text: 'La cuenta se registró correctamente.',
                confirmButtonText: 'Entendido',
              });
            } catch (requestError) {
              await Swal.fire({
                icon: 'error',
                title: 'No se pudo crear el usuario',
                text: (requestError as Error).message,
                confirmButtonText: 'Entendido',
              });
            }
          }}
        >
          Guardar usuario
        </button>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Usuarios</p>
            <h2>Listado actual</h2>
          </div>
          <div className="panel-meta">{filteredUsers.length} visibles</div>
        </div>

        {filteredUsers.length === 0 ? (
          <EmptyState
            title="No hay usuarios que coincidan"
            description="Ajusta la búsqueda o crea una nueva cuenta operativa."
          />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Grado</th>
                  <th>Correo</th>
                  <th>Teléfono</th>
                  <th>Región</th>
                  <th>Delegación</th>
                  <th>Rol</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.fullName}</td>
                    <td>{user.grade}</td>
                    <td>{user.email}</td>
                    <td>{user.phone}</td>
                    <td>{user.region?.name ?? '-'}</td>
                    <td>{user.delegation?.name ?? '-'}</td>
                    <td>{user.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
