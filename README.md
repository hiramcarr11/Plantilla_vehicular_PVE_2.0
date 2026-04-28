# Sistema de Control Vehicular

Monorepo con dos carpetas:

- `backend`: API NestJS + PostgreSQL + TypeORM + JWT + WebSockets.
- `frontend`: aplicación React + TypeScript + Vite para operación por rol.

## Roles del sistema

| Rol | Clave | Función |
|---|---|---|
| Enlace | `enlace` | Captura registros vehiculares de su delegación |
| Director Operativo | `director_operativo` | Monitorea delegaciones de su región |
| Admin Plantilla Vehicular | `plantilla_vehicular` | Consulta operación completa por región/delegación |
| Director General | `director_general` | Dashboard directivo con KPIs globales |
| Superadministrador | `superadmin` | Administra usuarios y bitácora |
| Coordinación | `coordinacion` | Administra usuarios, bitácora y consulta operación |

## Base de datos y migraciones

El esquema se gestiona con **migraciones de TypeORM**, no con `synchronize`.

```bash
cd backend
npm run migration:show   # Ver estado de migraciones
npm run migration:run    # Ejecutar pendientes
npm run migration:revert # Revertir última
```

Al arrancar (`npm run start:dev` o `npm start`), las migraciones pendientes se ejecutan automáticamente (`migrationsRun: true`).

## Variables de entorno

Revisar:

- [backend/.env.example](backend/.env.example)
- [frontend/.env.example](frontend/.env.example)

## Arranque

1. Instalar dependencias en `backend` y `frontend`.
2. Crear base de datos PostgreSQL.
3. Copiar `.env.example` a `.env` en cada proyecto.
   En backend define `SUPERADMIN_EMAIL`, `SUPERADMIN_PASSWORD` y opcionalmente `SUPERADMIN_FULL_NAME`.
4. `cd backend && npm run start:dev` (las migraciones corren automáticamente).
5. `cd frontend && npm run dev`.

Para primer despliegue, ejecutar seed: `npm run seed:users`.

## Notas

- Soft delete habilitado en usuarios y registros vehiculares.
- Bitácora de auditoría registra creación, edición, traslado, baja lógica y login/logout.
- Catálogo de regiones/delegaciones se gestiona como módulo con tablas `regions` y `delegations`.
- Mensajería entre usuarios disponible para roles `enlace`, `plantilla_vehicular` y `coordinacion`.
- Fotos de vehículos: máximo 3, formato JPG/JPEG/PNG/WEBP, máximo 5MB cada una.
