# Sistema de Control Vehicular

## Documento para presentacion directiva y capacitacion operativa

### 1. Proposito del sistema

El Sistema de Control Vehicular centraliza la plantilla vehicular institucional por region y delegacion. Su objetivo es que cada delegacion mantenga actualizada su informacion vehicular, que los mandos regionales y administrativos puedan supervisar la operacion en tiempo real, y que la Direccion cuente con una vista consolidada para la toma de decisiones.

El sistema no solo registra vehiculos. Tambien deja evidencia de los movimientos relevantes: altas, ediciones, reportes enviados, bajas logicas, traslados entre delegaciones y acciones administrativas. Cada movimiento queda asociado a un usuario, una fecha y una entidad afectada mediante la bitacora del sistema.

La mecanica principal se basa en dos conceptos:

- La plantilla vehicular vigente: representa el estado actual de los vehiculos registrados en cada delegacion.
- El reporte de plantilla: representa la confirmacion formal de que una delegacion reviso y envio el estado actual de su plantilla, aunque no existan cambios.

Con esto se resuelve una necesidad operativa importante: distinguir entre una delegacion que no ha reportado y una delegacion que si reporto, pero sin cambios.

### 2. Vision general del flujo operativo

Cada usuario entra al sistema con su cuenta institucional. Al iniciar sesion, el sistema identifica su rol y muestra solamente las funciones autorizadas para ese perfil.

La operacion inicia en la delegacion. El capturista registra los vehiculos que integran su plantilla, actualiza la informacion cuando haya cambios y envia el reporte de plantilla cuando se le solicite o cuando la propia delegacion decida confirmar su estado actual.

Los encargados regionales observan la actividad de sus delegaciones. La administracion puede consultar la operacion completa, filtrar por region o delegacion, revisar el estado de reportes y registrar traslados de vehiculos entre delegaciones. La Direccion consulta indicadores consolidados y el desglose por clase vehicular. El superadministrador administra usuarios y revisa la bitacora de movimientos sensibles.

### 3. Roles del sistema

El sistema contempla cinco roles:

| Rol | Funcion principal |
| --- | --- |
| Capturista | Captura y mantiene actualizada la plantilla vehicular de su delegacion. |
| Encargado regional | Supervisa las capturas de las delegaciones asignadas a su region. |
| Administrador | Consulta la operacion global y registra movimientos administrativos como traslados. |
| Director | Consulta indicadores consolidados para toma de decisiones. |
| Superadministrador | Administra usuarios y revisa la bitacora del sistema. |

### 4. Proceso del capturista

El capturista es el punto de entrada de la informacion vehicular. Su trabajo consiste en mantener actualizada la plantilla de la delegacion que tiene asignada.

#### 4.1 Acceso

El capturista ingresa al sistema con correo y contrasena. Al autenticarse, el sistema identifica su delegacion asignada y limita sus acciones a esa cobertura.

#### 4.2 Captura de vehiculos

Desde la pantalla de captura, el capturista registra cada vehiculo usando el formulario de plantilla vehicular. Los datos capturados incluyen:

- Placas
- Marca
- Tipo
- Uso
- Clase de vehiculo
- Modelo
- Numero de motor
- Numero de serie
- Resguardante
- Numero de patrulla
- Estado fisico
- Estatus
- Clasificacion del bien
- Observaciones

La delegacion no se captura manualmente como texto libre. El sistema la toma de la delegacion asignada al usuario. Esto evita que un capturista registre informacion en una delegacion que no le corresponde.

Al guardar una captura, el sistema normaliza los textos principales, crea el registro vehicular y genera una marca en bitacora con la accion `RECORD_CREATED`.

#### 4.3 Consulta de plantilla

El capturista puede consultar los vehiculos registrados desde su delegacion. Esta vista funciona como su plantilla vehicular vigente.

Desde esa pantalla puede identificar el numero de vehiculos capturados, la ultima captura realizada y el ultimo reporte de plantilla enviado.

#### 4.4 Edicion de capturas

Cuando exista un error o un cambio operativo, el capturista puede editar sus capturas permitidas. Cada edicion queda marcada en la bitacora con la accion `RECORD_UPDATED`.

La bitacora guarda:

- Campos modificados
- Valor anterior
- Valor nuevo
- Usuario que hizo el cambio
- Delegacion y region relacionadas

Esto permite conservar trazabilidad sin duplicar registros innecesariamente.

#### 4.5 Envio de reporte de plantilla

El capturista puede enviar el reporte de plantilla en el momento que se requiera. El reporte no depende de un cierre semanal o mensual fijo.

Al enviar el reporte, el sistema revisa si hubo movimientos desde el ultimo reporte enviado por esa delegacion:

- Si hubo altas, ediciones, bajas o traslados, el reporte queda como "con cambios".
- Si no hubo movimientos, el reporte queda como "sin cambios".

En ambos casos se crea evidencia formal de que la delegacion envio su estado actual.

Este proceso genera una bitacora con una de estas acciones:

- `ROSTER_REPORT_SUBMITTED_WITH_CHANGES`
- `ROSTER_REPORT_SUBMITTED_WITHOUT_CHANGES`

#### 4.6 Resultado esperado del rol

Al final del proceso, el capturista deja una plantilla vehicular actualizada y reportes enviados que permiten a los mandos saber si la delegacion cumplio con la actualizacion solicitada.

### 5. Proceso del encargado regional

El encargado regional supervisa las delegaciones pertenecientes a su region.

#### 5.1 Acceso regional

Al iniciar sesion, el sistema identifica la region asignada al usuario. La informacion visible se limita a las delegaciones de esa region.

#### 5.2 Monitoreo de capturas

El encargado regional consulta las capturas registradas por sus delegaciones. La informacion se presenta agrupada por region y delegacion, con filtros para localizar registros por datos como placas, marca, clase, estado fisico o estatus.

#### 5.3 Seguimiento en tiempo real

El sistema usa comunicacion en tiempo real para notificar nuevas capturas y cambios relevantes. Esto permite que el encargado regional tenga una vista actualizada sin depender solamente de recargar la pagina.

#### 5.4 Resultado esperado del rol

El encargado regional puede detectar actividad reciente, revisar que sus delegaciones esten registrando informacion y dar seguimiento operativo antes de que la informacion llegue a niveles administrativos o directivos.

### 6. Proceso del administrador

El administrador tiene una vista global de la operacion. Su objetivo es supervisar el avance general, consultar por region o delegacion y registrar movimientos que impactan la plantilla.

#### 6.1 Vista general

El administrador puede consultar todas las capturas agrupadas por region y delegacion. Puede aplicar filtros por:

- Region
- Delegacion
- Fecha inicial
- Fecha final
- Uso
- Clase de vehiculo
- Estado fisico
- Estatus
- Clasificacion
- Texto libre de busqueda

#### 6.2 Estado de reportes

La vista administrativa muestra el estado de los reportes por delegacion:

- Sin reporte: la delegacion aun no ha enviado confirmacion.
- Pendiente por cambios: hubo movimientos despues del ultimo reporte enviado.
- Reportado sin cambios: la delegacion envio reporte y no se detectaron movimientos desde el reporte anterior.
- Reportado con cambios: la delegacion envio reporte y el sistema detecto movimientos.

Este tablero permite diferenciar cumplimiento administrativo de actividad vehicular. Una delegacion puede no tener cambios y aun asi cumplir enviando su reporte.

#### 6.3 Traslado de vehiculos

El administrador puede registrar el traslado de un vehiculo de una delegacion a otra. Este proceso no se maneja como una simple edicion del campo delegacion.

El traslado genera un registro historico en la tabla de movimientos de traslado, donde se guarda:

- Vehiculo trasladado
- Delegacion origen
- Delegacion destino
- Usuario que registro el movimiento
- Motivo del traslado
- Fecha del movimiento

Ademas, el sistema actualiza la delegacion vigente del vehiculo en la plantilla actual.

La accion queda en bitacora como `RECORD_TRANSFERRED`.

#### 6.4 Bajas logicas

El administrador y el superadministrador pueden realizar baja logica de registros. La baja logica no elimina fisicamente el dato de la base, sino que marca el registro como eliminado mediante `deletedAt`.

La accion queda en bitacora como `RECORD_SOFT_DELETED`.

#### 6.5 Resultado esperado del rol

El administrador mantiene control global de la operacion, identifica delegaciones sin reporte, valida cambios recientes y registra movimientos administrativos que modifican la plantilla vehicular.

### 7. Proceso del director

El director consulta informacion consolidada para toma de decisiones.

#### 7.1 Dashboard directivo

El dashboard directivo muestra indicadores globales y una tabla de resumen por clase vehicular.

Los indicadores contemplan:

- Total de registros
- Total de regiones visibles
- Total de delegaciones visibles
- Total activo calculado

#### 7.2 Reporte por clase vehicular

El sistema agrupa los registros por clase de vehiculo y calcula:

- Total de unidades
- Total activo
- Desglose por estatus
- Descripciones capturadas en estatus no estandar
- Observaciones registradas

El total activo se calcula restando unidades con estatus operativo no activo, como:

- `INCATIVO`
- `SINIESTRADO`
- `PARA BAJA`

#### 7.3 Filtros directivos

La vista directiva permite filtrar por:

- Region
- Delegacion
- Fecha inicial
- Fecha final

#### 7.4 Resultado esperado del rol

El director obtiene una lectura ejecutiva del parque vehicular y puede revisar concentracion por clase, estatus y observaciones operativas.

### 8. Proceso del superadministrador

El superadministrador controla la administracion de usuarios y la supervision de movimientos sensibles.

#### 8.1 Administracion de usuarios

Puede crear, consultar, editar y dar de baja usuarios operativos.

Al crear un usuario se capturan:

- Nombre
- Apellido
- Grado
- Telefono
- Correo
- Contrasena
- Rol
- Region
- Delegacion

Los roles disponibles son:

- Capturista
- Encargado regional
- Administrador
- Director
- Superadministrador

El sistema valida datos obligatorios y contrasena minima de ocho caracteres al crear usuarios.

#### 8.2 Restriccion sobre superadministradores

Los usuarios con rol superadministrador tienen protecciones adicionales. El sistema evita que sean editados o eliminados desde el flujo normal de usuarios.

#### 8.3 Bitacora

El superadministrador tiene acceso a la bitacora en tiempo real. Esta vista muestra los movimientos criticos del sistema.

Entre las acciones registradas estan:

- `USER_CREATED`
- `USER_UPDATED`
- `USER_SOFT_DELETED`
- `RECORD_CREATED`
- `RECORD_UPDATED`
- `RECORD_SOFT_DELETED`
- `RECORD_TRANSFERRED`
- `ROSTER_REPORT_SUBMITTED_WITH_CHANGES`
- `ROSTER_REPORT_SUBMITTED_WITHOUT_CHANGES`

#### 8.4 Resultado esperado del rol

El superadministrador garantiza que los accesos esten controlados, que cada usuario tenga el rol y cobertura adecuados, y que exista trazabilidad sobre los movimientos sensibles.

### 9. Flujo completo de actualizacion vehicular

El proceso operativo recomendado es el siguiente:

1. El superadministrador crea usuarios y asigna rol, region o delegacion.
2. El capturista ingresa y registra la plantilla vehicular de su delegacion.
3. Si hay cambios, el capturista edita la informacion correspondiente.
4. Si un vehiculo cambia de delegacion, el administrador registra el traslado.
5. Cuando se solicite o se requiera, el capturista envia el reporte de plantilla.
6. El sistema determina si el reporte fue con cambios o sin cambios.
7. El administrador revisa el estado de reportes por delegacion.
8. El encargado regional supervisa las capturas de su region.
9. El director consulta indicadores consolidados.
10. El superadministrador revisa bitacora y administra accesos.

### 10. Mecanica de reportes de plantilla

El reporte de plantilla no es una nueva captura de vehiculo. Es una confirmacion del estado actual de la delegacion.

Esto significa que una delegacion puede enviar reporte aunque no haya modificado ningun vehiculo.

El sistema compara los movimientos desde el ultimo reporte de la delegacion. Los movimientos considerados son:

- Alta de vehiculo
- Edicion de vehiculo
- Baja logica
- Traslado de vehiculo

Con base en esa revision, el sistema define:

- `hasChanges = true`: si hubo movimientos.
- `hasChanges = false`: si no hubo movimientos.

Esta mecanica permite responder tres preguntas administrativas:

- Quien ya reporto.
- Quien reporto sin cambios.
- Quien tuvo movimientos despues de su ultimo reporte.

### 11. Mecanica de traslados

Un traslado cambia la delegacion vigente de un vehiculo, pero tambien conserva la historia del movimiento.

El sistema registra el traslado en una tabla especifica para no perder el origen del vehiculo. Esto evita que el historial dependa solamente del valor actual de la delegacion.

Cuando se registra un traslado:

1. Se identifica el vehiculo.
2. Se selecciona la delegacion destino.
3. Se captura el motivo.
4. Se guarda el movimiento historico.
5. Se actualiza la delegacion vigente del vehiculo.
6. Se genera bitacora.

### 12. Consideraciones tecnicas del sistema

#### 12.1 Arquitectura

El proyecto esta dividido en dos aplicaciones:

- Backend: API desarrollada con NestJS.
- Frontend: aplicacion web desarrollada con React, TypeScript y Vite.

La base de datos utilizada es PostgreSQL y el acceso a datos se gestiona con TypeORM.

#### 12.2 Autenticacion

La autenticacion se realiza con JWT. Al iniciar sesion, el backend devuelve un token de acceso y los datos del usuario autenticado.

El frontend conserva la sesion y usa el token para consumir los endpoints protegidos.

#### 12.3 Autorizacion por roles

El backend protege los endpoints mediante guardias de autenticacion y roles:

- `JwtAuthGuard`: valida que exista una sesion valida.
- `RolesGuard`: valida que el rol tenga permiso sobre la accion solicitada.
- `RequireRoles`: define que roles pueden acceder a cada endpoint.

El frontend tambien oculta rutas y opciones segun el rol, pero la seguridad principal esta en el backend.

#### 12.4 Comunicacion en tiempo real

El sistema usa WebSockets con Socket.IO para emitir eventos en tiempo real.

Eventos relevantes:

- `records.created`
- `records.changed`
- `reports.submitted`
- `audit.created`

Esto permite actualizar vistas administrativas, regionales y de bitacora sin depender exclusivamente de recargas manuales.

#### 12.5 Base de datos

Tablas principales:

| Tabla | Proposito |
| --- | --- |
| `users` | Usuarios del sistema y rol asignado. |
| `regions` | Catalogo de regiones. |
| `delegations` | Catalogo de delegaciones vinculadas a regiones. |
| `records` | Plantilla vehicular vigente. |
| `vehicle_roster_reports` | Reportes libres de plantilla enviados por delegaciones. |
| `vehicle_transfers` | Historial formal de traslados entre delegaciones. |
| `audit_logs` | Bitacora de movimientos sensibles. |

#### 12.6 Migraciones

El esquema se crea mediante migraciones de TypeORM. Actualmente la migracion base crea las tablas necesarias del sistema, incluyendo las tablas de reportes y traslados.

#### 12.7 Borrado logico

Las entidades principales heredan campos base:

- `id`
- `createdAt`
- `updatedAt`
- `deletedAt`

El campo `deletedAt` permite baja logica. Esto conserva trazabilidad y evita eliminaciones fisicas directas en operaciones sensibles.

#### 12.8 Seguridad

El sistema no debe almacenar contrasenas en texto plano. Las contrasenas se guardan como hash usando bcrypt.

Las variables sensibles, como credenciales de base de datos y secreto JWT, deben manejarse mediante archivos `.env` y no deben subirse al repositorio.

El backend tambien aplica encabezados de seguridad HTTP y configuracion CORS para limitar origenes permitidos.

### 13. Endpoints principales

#### Autenticacion

| Metodo | Ruta | Uso |
| --- | --- | --- |
| POST | `/api/auth/login` | Iniciar sesion. |
| GET | `/api/auth/me` | Obtener usuario actual. |

#### Catalogos

| Metodo | Ruta | Uso |
| --- | --- | --- |
| GET | `/api/catalog/regions` | Consultar regiones y delegaciones. |
| GET | `/api/catalog/record-fields` | Consultar catalogos del formulario vehicular. |

#### Vehiculos y reportes

| Metodo | Ruta | Uso |
| --- | --- | --- |
| POST | `/api/records` | Crear captura vehicular. |
| GET | `/api/records/my` | Consultar capturas del capturista. |
| PATCH | `/api/records/:id` | Editar captura. |
| DELETE | `/api/records/:id` | Baja logica de captura. |
| POST | `/api/records/:id/transfer` | Trasladar vehiculo. |
| POST | `/api/records/reports` | Enviar reporte de plantilla. |
| GET | `/api/records/reports/my` | Consultar reportes enviados por la delegacion. |
| GET | `/api/records/reports/overview` | Consultar estado global de reportes. |
| GET | `/api/records/region/live` | Vista regional. |
| GET | `/api/records/admin/overview` | Vista administrativa. |
| GET | `/api/records/director/overview` | Dashboard directivo. |

#### Usuarios

| Metodo | Ruta | Uso |
| --- | --- | --- |
| POST | `/api/users` | Crear usuario. |
| GET | `/api/users` | Listar usuarios. |
| PATCH | `/api/users/:id` | Editar usuario. |
| DELETE | `/api/users/:id` | Baja logica de usuario. |

#### Bitacora

| Metodo | Ruta | Uso |
| --- | --- | --- |
| GET | `/api/audit-logs/live` | Consultar bitacora reciente. |

### 14. Guia de capacitacion por perfil

#### Capturistas

Objetivo de capacitacion:
Que el capturista pueda registrar vehiculos, revisar su plantilla, editar registros y enviar reportes de plantilla.

Puntos a practicar:

1. Iniciar sesion.
2. Identificar su delegacion asignada.
3. Capturar un vehiculo.
4. Revisar la plantilla.
5. Editar una captura.
6. Enviar reporte de plantilla.
7. Interpretar "con cambios" y "sin cambios".

#### Encargados regionales

Objetivo de capacitacion:
Que el encargado regional pueda supervisar las delegaciones bajo su region.

Puntos a practicar:

1. Iniciar sesion.
2. Entrar a la vista de delegaciones.
3. Buscar un vehiculo por placas o marca.
4. Filtrar por estatus o clase.
5. Revisar actividad reciente.

#### Administradores

Objetivo de capacitacion:
Que el administrador pueda revisar la operacion completa, interpretar estados de reporte y registrar traslados.

Puntos a practicar:

1. Usar filtros por region y delegacion.
2. Interpretar tarjetas de reportes.
3. Revisar capturas por delegacion.
4. Registrar traslado.
5. Confirmar que el traslado cambie la delegacion vigente.

#### Directores

Objetivo de capacitacion:
Que la Direccion pueda leer indicadores y tomar decisiones con base en informacion consolidada.

Puntos a practicar:

1. Consultar KPIs.
2. Filtrar por region y delegacion.
3. Revisar tabla por clase vehicular.
4. Interpretar total activo.
5. Revisar observaciones.

#### Superadministradores

Objetivo de capacitacion:
Que el superadministrador pueda gestionar usuarios y revisar trazabilidad.

Puntos a practicar:

1. Crear usuario.
2. Asignar rol correcto.
3. Asignar region o delegacion.
4. Editar usuario.
5. Dar baja logica.
6. Revisar bitacora.

### 15. Mensaje ejecutivo para presentacion

El sistema permite pasar de una operacion dispersa a una operacion centralizada y trazable. Cada delegacion mantiene su propia plantilla vehicular, pero la informacion queda disponible para supervision regional, administrativa y directiva.

La diferencia clave es que el sistema no depende solamente de que existan cambios. Una delegacion puede confirmar su plantilla aunque no haya movimientos, y esa confirmacion queda registrada. Esto permite medir cumplimiento, no solo actividad.

Ademas, cada cambio sensible queda en bitacora. Esto fortalece el control interno, reduce perdida de informacion y permite revisar quien hizo cada movimiento, cuando lo hizo y sobre que registro.

### 16. Alcance actual

El sistema actualmente cubre:

- Autenticacion por usuario.
- Roles diferenciados.
- Captura vehicular por delegacion.
- Edicion auditada de capturas.
- Reporte libre de plantilla.
- Identificacion de reportes con cambios o sin cambios.
- Traslado historico de vehiculos.
- Vista regional.
- Vista administrativa.
- Dashboard directivo.
- Administracion de usuarios.
- Bitacora en tiempo real.

### 17. Puntos no documentados en el codigo

Los siguientes puntos no estan documentados en el codigo actual:

- Calendario oficial de solicitud de reportes.
- Procedimiento institucional externo para validar traslados.
- Reglas administrativas para autorizar bajas.
- Formato oficial impreso o exportable de reporte.
- Politica de retencion historica de bitacora.
- Catalogo oficial definitivo de regiones y delegaciones.
- Flujo de recuperacion de contrasena.
- Firma electronica o aprobacion formal de reportes.

Este documento fue generado a partir del codigo existente. No contiene suposiciones ni informacion inventada.
