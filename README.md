# Sistema de Control Vehicular

Monorepo base con dos carpetas:

- `backend`: API NestJS + PostgreSQL + TypeORM + JWT + WebSockets.
- `frontend`: aplicación React + TypeScript + Vite para operación por rol.

## Roles contemplados

- `capturist`: registra capturas de su delegación y consulta sus propias capturas.
- `regional_manager`: consulta en tiempo real las capturas de las delegaciones de su región.
- `admin`: consulta todas las capturas agrupadas por región y delegación.
- `superadmin`: administra usuarios y consulta bitácora en tiempo real.

## Variables de entorno

Revisar:

- [backend/.env.example](C:/Users/PVE-HCA/Documents/SISTEMA%20DE%20CONTROL%20VEHICULAR/backend/.env.example)
- [frontend/.env.example](C:/Users/PVE-HCA/Documents/SISTEMA%20DE%20CONTROL%20VEHICULAR/frontend/.env.example)

## Arranque

1. Instalar dependencias en `backend` y `frontend`.
2. Crear base de datos PostgreSQL.
3. Copiar `.env.example` a `.env` en cada proyecto.
   En backend define `SUPERADMIN_EMAIL`, `SUPERADMIN_PASSWORD` y opcionalmente `SUPERADMIN_FULL_NAME`.
4. Ejecutar `npm run start:dev` en backend y `npm run dev` en frontend.

## Notas

- Se dejó soporte para `soft delete` en usuarios y capturas.
- La bitácora registra creación, baja lógica y movimientos sensibles.
- El primer `superadmin` se crea automáticamente al arrancar si existen `SUPERADMIN_EMAIL` y `SUPERADMIN_PASSWORD`.
- El catálogo de regiones/delegaciones quedó como semilla inicial y conviene validarlo contra tu fuente oficial.
