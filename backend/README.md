# Homy

Homy es una aplicación que conecta a personas que necesitan un servicio para su hogar (plomería, electricidad, limpieza, pintura, etc.) con trabajadores independientes que lo ofrecen. Permite buscar trabajadores, solicitar y programar un servicio, hacer seguimiento y generar confianza mediante reseñas y verificación de perfiles.

Este repositorio contiene el backend del proyecto (API REST) correspondiente a la segunda entrega.

## Funcionalidades

1. **Búsqueda y contratación de servicios:** consultar trabajadores y sus perfiles, ver calificaciones y solicitar un servicio.
2. **Gestión de servicios:** programar la solicitud, que el trabajador la acepte o rechace y hacer seguimiento del estado hasta que se complete.
3. **Confianza y seguridad:** reseñas después de un servicio completado, verificación de trabajadores por parte del administrador y reportes.

## Tecnologías

| Parte | Tecnología |
|---|---|
| Backend | NestJS sobre Node.js y TypeScript |
| Base de datos | PostgreSQL |
| ORM | TypeORM |
| Autenticación | JWT con Passport |
| Validación | class-validator y class-transformer |
| Pruebas | Jest |
| Entorno | Docker y Docker Compose |
| Administración de la base de datos | DBeaver |

## Arquitectura

El sistema usa una arquitectura cliente-servidor. El cliente se comunica con el backend mediante una API REST y el backend se encarga de aplicar las reglas de negocio, validar los datos, controlar los permisos y comunicarse con la base de datos.

```
Usuario
   |
   v
Cliente (frontend)
   |
   |  HTTP / API REST
   v
Backend (NestJS + TypeScript)
   |   Controllers -> Services -> Repositorios (TypeORM)
   v
Base de datos (PostgreSQL)

Docker: entorno de desarrollo y ejecución de los servicios
```

### Módulos del backend

El backend está dividido en módulos, cada uno con una responsabilidad específica.

| Módulo | Responsabilidad |
|---|---|
| auth | Registro, inicio de sesión y autenticación con JWT |
| users | Información y gestión de los usuarios |
| workers | Perfiles profesionales de los trabajadores |
| services | Servicios que ofrecen los trabajadores |
| categories | Categorías de servicios |
| availability | Días y horarios disponibles de los trabajadores |
| requests | Solicitudes de servicio y sus estados |
| reviews | Calificaciones y reseñas |
| verifications | Proceso de verificación de trabajadores |
| reports | Reportes realizados por los usuarios |

Dentro de cada módulo se mantiene la misma organización:

```
src/<modulo>/
├── <modulo>.module.ts        Registra los providers y dependencias del módulo
├── <modulo>.controller.ts    Recibe las peticiones y devuelve las respuestas
├── <modulo>.service.ts       Operaciones y reglas de negocio
├── entities/                 Entidades de TypeORM (tablas)
├── dto/                      Datos de entrada y sus validaciones
└── <regla>-rules/            Reglas de negocio separadas del servicio
```

## Modelo de base de datos

La base de datos es relacional (PostgreSQL) porque la información está fuertemente conectada entre usuarios, trabajadores, servicios, solicitudes, reseñas y verificaciones. Los identificadores son UUID.

| Tabla | Descripción | Relaciones principales |
|---|---|---|
| users | Cuentas registradas (name, email, password_hash, phone, location, role) | Un usuario puede tener solicitudes, reseñas y reportes |
| worker_profiles | Perfil profesional (description, experience, verification_status, average_rating) | Pertenece a un usuario; tiene servicios, reseñas y verificaciones |
| categories | Categorías de servicios | Una categoría tiene varios servicios |
| services | Servicios que ofrece un trabajador (name, description, price) | Pertenece a una categoría y a un trabajador |
| availability | Horarios disponibles (day, start_time, end_time) | Pertenece a un trabajador |
| requests | Solicitudes de servicio (fecha, dirección, descripción, precio, estado) | Relaciona un cliente, un trabajador y un servicio |
| reviews | Calificación (1 a 5) y comentario | Una reseña por solicitud completada |
| verifications | Solicitudes de verificación (status, verified_at) | Pertenece a un trabajador y guarda el administrador que la revisó |
| reports | Reportes (reason, description, status) | Relaciona a quien reporta, al usuario reportado y la solicitud |

Valores definidos:

- Roles de usuario: `user`, `worker`, `admin`.
- Estados de una solicitud: `requested`, `accepted`, `in_progress`, `completed`, `rejected`, `cancelled`, `expired`.
- Estados de verificación: `pending`, `verified`, `rejected`.

El diagrama completo del modelo está en `docs/database.png` [COMPLETAR: ruta de la imagen].

## Autenticación y autorización

- **Autenticación:** el usuario se registra en `/auth/register` e inicia sesión en `/auth/login`. La respuesta incluye un token JWT que se envía en cada petición protegida:

  ```
  Authorization: Bearer <token>
  ```

- **Autorización:** se verifica siempre en el backend.
  - `JwtAuthGuard` exige un token válido.
  - `AdminGuard` restringe las rutas al rol `admin`.
  - Además del rol, los servicios comprueban que cada persona solo modifique lo que le corresponde (por ejemplo, solo el cliente de una solicitud puede reseñarla).
- **Validación:** los datos de entrada se validan con DTOs y `ValidationPipe` (se descartan los campos no permitidos).
- **Errores:** se responde con códigos HTTP consistentes: 400 (datos inválidos), 401 (sin autenticar), 403 (sin permiso), 404 (no existe) y 409 (conflicto con una regla de negocio).

### Reglas de negocio principales

- Un usuario solo puede tener un perfil profesional; al crearlo pasa a ser trabajador.
- Las solicitudes siguen un flujo de estados definido.
- Solo se puede reseñar una solicitud completada, solo el cliente que la hizo y una sola vez. Al crear la reseña se recalcula la calificación promedio del trabajador.
- Un trabajador solo puede tener una solicitud de verificación pendiente a la vez.
- Solo el administrador puede aprobar o rechazar una verificación, y una verificación ya revisada no se puede modificar. El resultado se refleja en el perfil del trabajador.
- Los perfiles públicos no muestran correo ni teléfono.

## Endpoints

Acceso: **Público** (sin token), **JWT** (usuario autenticado) o **Admin** (rol administrador).

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | /auth/register | Público | Registrar una cuenta |
| POST | /auth/login | Público | Iniciar sesión y obtener el token |
| GET | /auth/me | JWT | Datos del usuario autenticado |
| POST | /users | JWT | Crear un usuario |
| GET | /users | JWT | Listar usuarios |
| GET | /users/:id | JWT | Consultar un usuario |
| PATCH | /users/:id | JWT | Actualizar un usuario |
| DELETE | /users/:id | JWT | Eliminar un usuario |
| GET | /workers | Público | Listar trabajadores (filtros `minRating`, `verificationStatus`, `limit`) |
| GET | /workers/:id | Público | Perfil de un trabajador |
| GET | /workers/me | JWT | Perfil profesional propio |
| POST | /workers | JWT | Crear el perfil profesional |
| PATCH | /workers/me | JWT | Actualizar el perfil profesional propio |
| POST | /requests | JWT | Crear una solicitud de servicio |
| GET | /requests | JWT | Listar solicitudes |
| GET | /requests/:id | JWT | Consultar una solicitud |
| PATCH | /requests/:id/status | JWT | Cambiar el estado de una solicitud |
| POST | /reviews | JWT | Reseñar una solicitud completada |
| GET | /reviews/received | JWT | Reseñas recibidas por el trabajador autenticado |
| GET | /reviews/worker/:workerId | Público | Reseñas de un trabajador |
| POST | /verifications | JWT | Solicitar la verificación del perfil |
| GET | /verifications/me | JWT | Historial de verificaciones propias |
| GET | /verifications | Admin | Listar verificaciones (filtro `status`) |
| GET | /verifications/:id | Admin | Consultar una verificación |
| PATCH | /verifications/:id/review | Admin | Aprobar o rechazar una verificación |
| POST | /reports | JWT | Crear un reporte |
| GET | /reports | JWT | Listar reportes |
| GET | /reports/:id | JWT | Consultar un reporte |
| PATCH | /reports/:id/status | JWT | Actualizar el estado de un reporte |

[COMPLETAR: endpoints de services, categories y availability cuando se integren.]

## Variables de entorno

Se configuran en un archivo `.env` dentro de `backend/`. El archivo `.env.example` incluye todas las variables sin valores; el archivo `.env` no se sube al repositorio.

| Variable | Descripción | Ejemplo en desarrollo |
|---|---|---|
| PORT | Puerto en el que corre la API | 3000 |
| API_PREFIX | Prefijo de las rutas de la API | api |
| DB_HOST | Servidor de la base de datos | localhost |
| DB_PORT | Puerto de PostgreSQL | 5432 |
| DB_USERNAME | Usuario de la base de datos | postgres |
| DB_PASSWORD | Contraseña de la base de datos | (la que definas) |
| DB_DATABASE | Nombre de la base de datos | homy |
| DB_SYNC | Sincronizar las tablas automáticamente (`true` solo en desarrollo) | true |
| JWT_SECRET | Clave para firmar los tokens (mínimo 64 caracteres) | (cadena aleatoria) |

Para generar un `JWT_SECRET` válido:

```bash
openssl rand -hex 48
```

## Instalación y ejecución

### Requisitos

- Node.js 20 o superior y npm
- Docker y Docker Compose

### Pasos

1. Clonar el repositorio y entrar a la carpeta del backend:

   ```bash
   git clone <url-del-repositorio>
   cd Homy/backend
   ```

2. Levantar la base de datos con Docker:

   ```bash
   docker compose up -d
   ```

   Esto crea un contenedor de PostgreSQL 17 (`homy-db`) en el puerto 5432 con la base de datos `homy`.

3. Crear el archivo de variables de entorno y completarlo:

   ```bash
   cp .env.example .env
   ```

4. Instalar las dependencias:

   ```bash
   npm install
   ```

5. Iniciar el backend en modo desarrollo:

   ```bash
   npm run start:dev
   ```

   La API queda disponible en `http://localhost:3000`.

[COMPLETAR: instrucciones para ejecutar el backend con Docker cuando exista el Dockerfile.]

### Otros comandos

| Comando | Descripción |
|---|---|
| `npm run build` | Compila el proyecto |
| `npm run start:prod` | Ejecuta la versión compilada |
| `npm run lint` | Revisa y corrige el estilo del código |
| `npm run format` | Da formato al código con Prettier |

## Pruebas

```bash
npm test            # pruebas unitarias
npm run test:cov    # pruebas unitarias con cobertura
npm run test:e2e    # pruebas de integración
```

Las pruebas unitarias cubren los servicios y las reglas de negocio de los módulos, usando mocks de los repositorios y de las dependencias entre módulos.

[COMPLETAR: flujos cubiertos por las pruebas de integración.]

## Colección de Postman

La colección está en `postman/Homy.postman_collection.json` [COMPLETAR: ruta]. Para usarla:

1. Importar la colección y el environment en Postman.
2. Definir la variable `baseUrl` (por ejemplo `http://localhost:3000`).
3. Ejecutar las carpetas en orden: autenticación, trabajadores, solicitudes, reseñas, verificaciones.

El token de cada rol se guarda automáticamente al iniciar sesión y se usa en las peticiones siguientes.

## Despliegue

URL del backend desplegado: [COMPLETAR: URL]

## Credenciales de demostración

Cuentas creadas solo para la demostración:

| Rol | Correo | Contraseña |
|---|---|---|
| Usuario | [COMPLETAR] | [COMPLETAR] |
| Trabajador | [COMPLETAR] | [COMPLETAR] |
| Administrador | [COMPLETAR] | [COMPLETAR] |

## Estructura del repositorio

```
Homy/
├── backend/
│   ├── src/              Código fuente (un directorio por módulo)
│   ├── test/             Pruebas de integración
│   ├── compose.yaml      Servicios de desarrollo (PostgreSQL)
│   ├── .env.example      Variables de entorno documentadas
│   └── package.json
├── frontend/
└── README.md
```