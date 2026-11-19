# Homy · Backend

| | URL |
|---|---|
| Frontend (Vercel) | https://homy-frontend-drab.vercel.app |
| Backend / API (Render) | https://homy-backend-qph1.onrender.com |

Homy es una aplicación que conecta a personas que necesitan un servicio para su hogar (plomería, electricidad, limpieza, pintura, etc.) con trabajadores independientes que lo ofrecen. Permite buscar trabajadores de la misma ciudad, solicitar y programar un servicio, hacer seguimiento y generar confianza mediante reseñas, verificación de perfiles y reportes.

Esta carpeta contiene el backend del proyecto (API REST). El frontend está en [`../frontend`](../frontend/README.md).

## Funcionalidades

1. **Búsqueda y contratación de servicios:** consultar trabajadores de la misma ciudad y sus perfiles, ver calificaciones y solicitar un servicio en una hora libre de su agenda.
2. **Gestión de servicios:** el trabajador publica servicios (revisados por el administrador), define su disponibilidad y acepta, rechaza o completa las solicitudes.
3. **Confianza y seguridad:** verificación de trabajadores documento por documento, reseñas después de un servicio completado, reportes con evidencia y suspensión de cuentas.

## Tecnologías

| Parte | Tecnología |
|---|---|
| Backend | NestJS 11 sobre Node.js y TypeScript |
| Base de datos | PostgreSQL (Docker en desarrollo, Neon en producción) |
| ORM | TypeORM |
| Autenticación | JWT con Passport; contraseñas con argon2id |
| Validación | class-validator y class-transformer |
| Pruebas | Jest |
| Entorno | Docker Compose (base de datos de desarrollo) |
| Despliegue | Render (API) y Neon (PostgreSQL) |

## Arquitectura

El sistema usa una arquitectura cliente-servidor. El frontend (Next.js) llama a la API desde su servidor y el backend aplica las reglas de negocio, valida los datos, controla los permisos y se comunica con la base de datos.

```
Usuario
   |
   v
Frontend Next.js (Vercel)
   |   Server Components y Server Actions
   |   HTTP / API REST con Authorization: Bearer <token>
   v
Backend NestJS (Render)
   |   Controllers -> Services -> Repositorios (TypeORM)
   v
PostgreSQL (Neon)
```

### Módulos

| Módulo | Responsabilidad |
|---|---|
| auth | Registro, inicio de sesión, JWT y perfil propio |
| users | Gestión de usuarios y suspensión de cuentas (admin) |
| workers | Perfiles profesionales y catálogo público |
| services | Servicios de los trabajadores y su revisión por el admin |
| categories | Categorías de servicios |
| availability | Franjas de disponibilidad y horas libres |
| requests | Solicitudes de servicio y sus estados |
| reviews | Calificaciones y reseñas |
| verifications | Verificación de trabajadores (documentos y categorías) |
| reports | Reportes, respuesta de la persona reportada y cierre |
| common | Utilidades compartidas (validación, comparación de ubicaciones) |

Cada módulo mantiene la misma organización:

```
src/<modulo>/
├── <modulo>.module.ts        Registra providers y dependencias
├── <modulo>.controller.ts    Recibe las peticiones y devuelve las respuestas
├── <modulo>.service.ts       Operaciones y reglas de negocio
├── <modulo>.service.spec.ts  Pruebas unitarias
├── entities/                 Entidades de TypeORM (tablas)
├── dto/                      Datos de entrada y sus validaciones
├── enums/                    Estados posibles (cuando aplica)
└── <regla>-rules/            Reglas de negocio separadas del servicio
```

## Modelo de base de datos

La base de datos es relacional porque la información está muy conectada entre usuarios, trabajadores, servicios, solicitudes, reseñas y verificaciones. Los identificadores son UUID.

| Tabla | Descripción | Relaciones principales |
|---|---|---|
| users | Cuentas (name, email, password_hash, phone, location, role, status, avatar_url, suspension_reason, suspended_at) | Un usuario puede tener solicitudes, reseñas y reportes |
| worker_profiles | Perfil profesional (description, experience, verification_status, average_rating, categorías aprobadas) | Pertenece a un usuario; tiene servicios, reseñas y verificaciones |
| categories | Categorías (nombre, descripción, imagen, activa) | Una categoría tiene varios servicios |
| services | Servicios (name, description, price, duración, estado de revisión) | Pertenece a una categoría y a un trabajador |
| availability | Franjas disponibles (day, start_time, end_time) | Pertenece a un trabajador |
| requests | Solicitudes (fecha, dirección, descripción, precio, estado, motivo de cancelación) | Relaciona un cliente, un trabajador y un servicio |
| reviews | Calificación (1 a 5) y comentario | Una reseña por solicitud completada |
| verifications | Verificación (tipo, estado, documentos y categorías con su decisión) | Pertenece a un trabajador; guarda el admin que la revisó |
| reports | Reportes (motivo, descripción, evidencia, respuesta, estado, cierre) | Relaciona a quien reporta, a la persona reportada y la solicitud |

Valores definidos:

| Campo | Valores |
|---|---|
| Rol de usuario | `user` (cliente), `worker`, `admin` |
| Estado de la cuenta | `active`, `suspended` |
| Estado de una solicitud | `requested`, `accepted`, `in_progress`, `completed`, `rejected`, `cancelled`, `expired` |
| Estado de una verificación | `pending`, `verified`, `rejected`, `changes_requested` |
| Estado de un servicio | `in_review`, `published`, `changes_requested`, `rejected` |
| Estado de un reporte | `pending`, `investigating`, `resolved`, `dismissed` |

## Autenticación y autorización

- **Registro e inicio de sesión:** `POST /auth/register` y `POST /auth/login`. La contraseña debe tener entre 15 y 128 caracteres, sin espacios, y se guarda con argon2id. El login devuelve un JWT que se envía en cada petición protegida:

  ```
  Authorization: Bearer <token>
  ```

- **Autorización**, siempre en el backend:
  - `JwtAuthGuard` exige un token válido. Una cuenta suspendida no puede iniciar sesión (403) y su token deja de servir (401).
  - `AdminGuard` restringe las rutas al rol `admin`.
  - `RolesGuard` con `@Roles('user' | 'worker')` restringe las rutas de cliente y de trabajador.
  - Además del rol, los servicios comprueban que cada persona solo modifique lo suyo (por ejemplo, solo el cliente de una solicitud puede reseñarla).
- **Validación:** DTOs con `ValidationPipe`; se descartan los campos no permitidos.
- **Errores:** 400 (datos inválidos), 401 (sin autenticar), 403 (sin permiso), 404 (no existe) y 409 (conflicto con una regla de negocio).

## Reglas de negocio

**Trabajadores y verificación**
- Un usuario solo puede tener un perfil profesional.
- **Verificación inicial:** tres documentos (foto de perfil, cédula y foto con la cédula) y una o más categorías con su evidencia. El admin aprueba o rechaza cada elemento con motivos y comentario. Si rechaza algo, la verificación queda en `changes_requested` y el trabajador reenvía solo lo rechazado.
- **Categorías nuevas:** un trabajador verificado puede pedir otra categoría (`type: "category"`).
- **Foto de perfil:** la foto enviada en la verificación pasa a ser el avatar solo cuando el admin aprueba los tres documentos. Mientras tanto el trabajador aparece con sus iniciales.
- **Nombre y foto bloqueados:** el trabajador no puede cambiar su nombre ni su foto desde su perfil (`PATCH /auth/profile` responde 403), porque son los que aprobó el admin. Sí puede cambiar celular, ubicación, descripción y experiencia. Clientes y administradores pueden cambiar nombre y foto.

**Servicios y agenda**
- Solo un trabajador verificado publica, y solo en sus categorías aprobadas.
- Todo servicio nuevo o editado queda `in_review` hasta que el admin lo publique, pida cambios o lo rechace. El catálogo público solo muestra servicios `published`.
- La duración se redondea hacia arriba a horas completas: un servicio de 2 horas a las 08:00 bloquea de 08:00 a 10:00.
- Al crear y al aceptar una solicitud se comprueba que quepa en la disponibilidad y que no se cruce con otra activa. `GET /availability/worker/:id/slots` devuelve solo las horas libres.

**Solicitudes**
- **Misma ciudad:** un cliente solo contrata trabajadores de su ciudad y un trabajador solo acepta solicitudes de clientes de su ciudad. Se compara "Ciudad, Departamento" sin tildes ni mayúsculas, porque hay ciudades con el mismo nombre en departamentos distintos. `GET /workers?city=…` filtra el catálogo así.
- Las solicitudes siguen un flujo de estados definido.
- Cancelar exige un motivo y una nota de al menos 10 caracteres; se guarda quién canceló y cuándo.
- Solo el cliente reseña una solicitud completada, una sola vez. Al reseñar se recalcula el promedio del trabajador.

**Reportes y cuentas**
- Los reportes llevan evidencia. La persona reportada puede dar su versión con evidencia y el admin cierra el caso (resuelto o descartado) con las acciones tomadas y una nota para las dos partes.
- Suspender una cuenta cambia su estado a `suspended` con un motivo, sin borrar el registro. Se puede reactivar.

**Datos**
- Los archivos (documentos, evidencias, fotos e imágenes de categorías) viajan como data URLs. El frontend comprime las imágenes antes de enviarlas y el límite del cuerpo JSON es de 25 MB.
- Los perfiles públicos no muestran correo ni teléfono.

## Endpoints

Las rutas no llevan prefijo (por ejemplo `https://homy-backend-qph1.onrender.com/categories`).

Acceso: **Público** (sin token), **JWT** (cualquier usuario autenticado), **Cliente**, **Trabajador** o **Admin**.

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | /auth/register | Público | Registrar una cuenta (cliente o trabajador) |
| POST | /auth/login | Público | Iniciar sesión; devuelve el token y el usuario con su rol |
| GET | /auth/me | JWT | Usuario autenticado (id, correo, rol, nombre) |
| GET / PATCH | /auth/profile | JWT | Perfil propio (el trabajador no puede cambiar nombre ni foto) |
| GET / POST | /users | Admin | Listar o crear usuarios (incluye administradores) |
| GET / PATCH / DELETE | /users/:id | Admin | Consultar, actualizar o eliminar un usuario |
| PATCH | /users/:id/suspend | Admin | Suspender con motivo (no borra la cuenta) |
| PATCH | /users/:id/reactivate | Admin | Reactivar una cuenta suspendida |
| GET | /workers | Público | Trabajadores con servicios publicados (`?city=` para la misma ciudad) |
| GET | /workers/:id | Público | Perfil público de un trabajador |
| GET / PATCH | /workers/me | Trabajador | Perfil profesional propio |
| GET | /categories | Público | Categorías activas |
| GET | /categories/all | Admin | Todas las categorías con su número de servicios |
| POST / PATCH | /categories, /categories/:id | Admin | Crear o editar (nombre, descripción, imagen) |
| PATCH | /categories/:id/activate, /deactivate | Admin | Activar o desactivar |
| GET | /services | Público | Servicios publicados |
| GET | /services/worker/:workerId | Público | Servicios publicados de un trabajador |
| GET | /services/mine | Trabajador | Servicios propios con su estado de revisión |
| POST | /services | Trabajador | Publicar (queda en revisión) |
| PATCH / DELETE | /services/:id | Trabajador | Editar (vuelve a revisión) o eliminar |
| GET | /services/review, /services/review/:id | Admin | Servicios para revisar (filtro `status`) |
| PATCH | /services/:id/review | Admin | Publicar, pedir cambios o rechazar con nota |
| GET | /availability/worker/:workerId | Público | Franjas de disponibilidad de un trabajador |
| GET | /availability/worker/:workerId/slots | Público | Horas libres para un servicio (`date`, `serviceId`) |
| GET / POST | /availability, /availability/mine | Trabajador | Franjas propias |
| PATCH / DELETE | /availability/:id | Trabajador | Cambiar o quitar una franja |
| POST | /requests | Cliente | Crear una solicitud (valida ciudad y disponibilidad) |
| GET | /requests | JWT | Solicitudes del cliente, con servicio, trabajador y reseña |
| GET | /requests/received | Trabajador | Solicitudes recibidas |
| GET | /requests/:id | JWT | Una solicitud (solo sus participantes) |
| PATCH | /requests/:id/status | JWT | Cambiar el estado (al cancelar: `reason` y `note`) |
| POST | /reviews | JWT | Reseñar una solicitud completada |
| GET | /reviews/received | JWT | Reseñas recibidas por el trabajador autenticado |
| GET | /reviews/worker/:workerId | Público | Reseñas de un trabajador |
| POST | /verifications | Trabajador | Enviar verificación inicial o de una categoría nueva |
| GET | /verifications/me | Trabajador | Historial propio |
| PATCH | /verifications/:id/resubmit | Trabajador | Reenviar los elementos rechazados |
| GET | /verifications | Admin | Listar (filtro `status`; sin el contenido de los archivos) |
| GET | /verifications/:id | Admin | Detalle con los archivos |
| PATCH | /verifications/:id/review | Admin | Decidir cada documento y categoría |
| POST | /reports | JWT | Crear un reporte con evidencia |
| GET | /reports | JWT | Reportes hechos por mí |
| GET | /reports/received | JWT | Reportes en mi contra |
| GET | /reports/:id | JWT | Detalle (participantes o admin) |
| PATCH | /reports/:id/response | JWT | Versión de la persona reportada |
| GET | /reports/all | Admin | Todos los reportes |
| PATCH | /reports/:id/status | Admin | Resolver o descartar con acciones y nota |

## Variables de entorno

Se configuran en `backend/.env` (no se sube al repositorio). `.env.example` tiene la lista de variables sin valores.

| Variable | Descripción | Desarrollo |
|---|---|---|
| PORT | Puerto de la API | 3000 |
| DB_HOST | Servidor de PostgreSQL | localhost |
| DB_PORT | Puerto de PostgreSQL | 5432 |
| DB_USERNAME | Usuario de la base de datos | postgres |
| DB_PASSWORD | Contraseña de la base de datos | postgres |
| DB_DATABASE | Nombre de la base de datos | homy |
| DB_SYNCHRONIZE | Sincroniza las tablas al arrancar. **Ojo:** la condición en `app.module.ts` está invertida, así que se sincroniza con el valor `false` | false |
| NODE_ENV | Con `production` la conexión a la base de datos usa SSL (necesario en Neon) | development |
| JWT_SECRET | Clave para firmar los tokens (mínimo 64 caracteres) | (cadena aleatoria) |
| FRONTEND_URL | Orígenes del frontend permitidos por CORS, separados por coma | http://localhost:3001 |

`.env.example` también lista `API_PREFIX` y `DB_SYNC`, pero el código no las usa.

Para generar un `JWT_SECRET`:

```bash
openssl rand -hex 48
```

## Instalación y ejecución local

Requisitos: Node.js 20 o superior, npm, Docker y Docker Compose.

1. Clonar el repositorio y entrar al backend:

   ```bash
   git clone https://github.com/DaliaLopez/Homy.git
   cd Homy/backend
   ```

2. Levantar PostgreSQL con Docker (contenedor `homy-db`, PostgreSQL 17, puerto 5432, base `homy`, usuario y contraseña `postgres`):

   ```bash
   docker compose up -d
   ```

3. Crear el archivo de variables y completarlo con la tabla anterior:

   ```bash
   cp .env.example .env
   ```

4. Instalar dependencias e iniciar en modo desarrollo:

   ```bash
   npm install
   npm run start:dev
   ```

   La API queda en `http://localhost:3000`. Para usarla desde el frontend local, pon `HOMY_API_URL=http://localhost:3000` en `frontend/.env.local`.

### Crear un administrador

No hay registro de administradores desde la app. Crea la cuenta desde el registro normal y luego cambia su rol en la base de datos (en Neon, desde el SQL Editor):

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@tucorreo.com';
```

### Otros comandos

| Comando | Descripción |
|---|---|
| `npm run build` | Compila el proyecto en `dist/` |
| `npm run start:prod` | Ejecuta la versión compilada |
| `npm run lint` | Revisa y corrige el estilo del código |
| `npm run format` | Da formato con Prettier |

## Pruebas

```bash
npm test            # pruebas unitarias
npm run test:cov    # con cobertura
npm run test:e2e    # pruebas de integración
```

Las pruebas unitarias cubren los servicios y las reglas de negocio de cada módulo con mocks de los repositorios. Entre ellas están el bloqueo de nombre y foto del trabajador y la asignación de la foto de perfil solo cuando el admin aprueba los documentos.

## Despliegue

- **API:** Render, con la carpeta `backend` como raíz.
- **Base de datos:** Neon (PostgreSQL), con `NODE_ENV=production` para la conexión SSL.
- **CORS:** `FRONTEND_URL` debe incluir `https://homy-frontend-drab.vercel.app`.
- **Esquema:** con `DB_SYNCHRONIZE=false`, TypeORM sincroniza las tablas al arrancar (la condición está invertida), así que las columnas nuevas se crean al desplegar. Todas son opcionales o tienen valor por defecto, y los servicios que ya existían quedan `published`.

Los cambios del backend solo se ven en el frontend desplegado cuando Render despliega el último commit.

## Estructura del repositorio

```
Homy/
├── backend/
│   ├── src/              Código fuente (un directorio por módulo)
│   ├── test/             Pruebas de integración
│   ├── compose.yaml      PostgreSQL de desarrollo
│   ├── .env.example      Variables de entorno
│   └── package.json
└── frontend/             Next.js (App Router), ver frontend/README.md
```
