# Homy · Frontend

| | URL |
|---|---|
| Frontend (Vercel) | https://homy-frontend-drab.vercel.app |
| Backend / API (Render) | https://homy-backend-qph1.onrender.com |

Interfaz de Homy en **Next.js 16** (App Router) y **React 19**. Consume la API de NestJS que está en [`../backend`](../backend/README.md).

## Puesta en marcha

Requisitos: Node.js 20 o superior y npm.

```bash
cd frontend
npm ci
cp .env.example .env.local
npm run dev                  # http://localhost:3001
```

### Variables de entorno

| Variable | Descripción | Valor |
|---|---|---|
| HOMY_API_URL | URL de la API, sin barra final | `https://homy-backend-qph1.onrender.com` (o `http://localhost:3000` con el backend local) |

Solo la lee el servidor de Next.js (`src/lib/homy-api.ts` es `server-only`). El navegador nunca llama a la API ni ve el token, por eso no lleva el prefijo `NEXT_PUBLIC_`. Si falta, se usa la URL de Render.

### Comandos

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo en el puerto 3001 |
| `npm run build` | Compila para producción |
| `npm run start` | Ejecuta la versión compilada |
| `npm run lint` | Revisa el código con ESLint |
| `npx tsc --noEmit` | Revisa los tipos |

## Despliegue en Vercel

- **URL:** https://homy-frontend-drab.vercel.app
- **Root Directory:** `frontend` (el repo tiene `backend` y `frontend` en la misma raíz).
- **Framework Preset:** Next.js, con los comandos de build e instalación por defecto.
- **Variable de entorno:** `HOMY_API_URL=https://homy-backend-qph1.onrender.com` en Production, Preview y Development.
- **Backend:** la variable `FRONTEND_URL` de Render debe incluir la URL de Vercel.

## Roles y pantallas

| Rol | Inicio | Qué puede hacer |
|---|---|---|
| Visitante | `/register` | Bienvenida, registro e inicio de sesión |
| Cliente | `/` | Ver profesionales de su ciudad, solicitar un servicio en una hora libre, seguir y cancelar sus solicitudes, calificar, reportar y editar su perfil |
| Trabajador | `/worker` | Verificarse (documentos y categorías), publicar servicios, definir su agenda, gestionar solicitudes, ver reseñas y reportes, pedir categorías nuevas |
| Administrador | `/admin` | Revisar verificaciones y servicios, gestionar categorías, resolver reportes y suspender o reactivar usuarios |

**Comportamientos importantes:**
- **Misma ciudad:** el catálogo y el inicio del cliente solo muestran profesionales de su ciudad, y el backend rechaza contrataciones entre ciudades distintas.
- **Perfil del trabajador:** el nombre aparece deshabilitado (como el correo) y no hay opción para cambiar la foto, porque son los que aprobó el administrador. El backend también lo bloquea.
- **Foto del trabajador:** el navbar y el perfil muestran sus iniciales hasta que el administrador aprueba sus documentos. Después se usa la foto que envió en la verificación.
- **Inicio del trabajador sin verificar:** muestra el estado de la verificación y accesos a "Escribe tu descripción" y "Define tu disponibilidad". La foto ya no se pide ahí, porque va en la verificación.
- **Favoritos:** se guardan en el navegador (`localStorage`), no en la API.
- **Notificaciones:** la campana arma sus avisos con los datos reales de cada rol (`src/lib/notifications.ts`); la API no tiene un módulo de notificaciones.
- **Soporte:** botón de WhatsApp (`src/lib/support.ts`).

## Sesión, cookies y roles

1. **Login** (`src/shared/actions/auth.ts`): una Server Action envía correo y contraseña a `POST /auth/login` y guarda el JWT en la cookie `homy_token` (`httpOnly`, `sameSite: lax`, `secure` en producción, con la misma duración que el token).
2. **Peticiones privadas** (`src/lib/homy-api.ts`): `homyFetch` lee la cookie, envía `Authorization: Bearer …` y vuelve a `/login` si la API responde 401.
3. **Roles** (`src/lib/session.ts`): `requireRole()` consulta `GET /auth/me` una vez por petición y se usa en los layouts, en las páginas y en cada Server Action. Con otro rol se redirige a su propio inicio.
4. **`src/proxy.ts`**: primera barrera. Sin cookie no se entra a `/my/*`, `/worker/*` ni `/admin/*`, y `/` lleva a la bienvenida.
5. **Cerrar sesión:** borra la cookie y vuelve a `/login`.

El backend vuelve a validar el rol en cada endpoint: ocultar un enlace no protege la API.

## Estructura

El código está organizado **por rol**: cada rol tiene en `app/` sus páginas, sus componentes (`_components/`) y sus Server Actions (`_actions/`). Las carpetas que empiezan con `_` no crean rutas y las que van entre `( )` no aparecen en la URL.

```
src/
├── proxy.ts                     sin cookie → /login (o /register desde /)
├── app/
│   ├── layout.tsx               layout raíz; importa styles/index.css
│   ├── (auth)/                  /login, /register
│   ├── (public)/                inicio, catálogo y perfil público del profesional
│   ├── (client)/my/             CLIENTE: solicitudes, reportes y perfil
│   ├── worker/                  TRABAJADOR: verificación, servicios, agenda, solicitudes, reseñas, reportes
│   └── admin/                   ADMIN: verificaciones, servicios, categorías, reportes, usuarios
├── shared/                      lo que usan dos o más roles
│   ├── ui/                      icon, modal, notice, avatar, stars, file-picker…
│   ├── layout/                  app-shell, navegación, notificaciones
│   ├── requests/                detalle y tablero de solicitudes
│   ├── reports/                 reportes
│   ├── profile/                 perfil (los tres roles)
│   └── actions/                 auth, profile, reports, requests
├── lib/                         homy-api, session, data, formatos, agenda, ciudades de Colombia
├── styles/                      CSS por carpetas (ver abajo)
└── types/                       tipos de los datos de la API
```

**Regla para saber dónde va algo nuevo:** si lo usa un solo rol, va en la carpeta de ese rol. Si lo usan dos o más, va en `shared/`.

## Estilos

CSS normal (sin Tailwind), mobile first, con cortes en 768 px y 1024 px. Todo entra por `src/styles/index.css`, que importa los demás archivos en orden. **Ese orden es parte de la cascada:** no lo cambies sin revisar las capas (`@layer base, components`).

```
src/styles/
├── index.css
├── base/     reset y capas, variables de diseño (tokens), utilidades de layout, reducción de movimiento
├── shared/   header, barra inferior, botones, chips, tarjetas, formularios, modal, perfil, solicitudes, reportes…
├── auth/     bienvenida, login y registro
├── user/     inicio, catálogo y perfil público del profesional
├── worker/   verificación, perfil verificado, servicios, agenda y perfil
└── admin/    encabezado, tablas, categorías y revisión de servicios
```

`shared/overrides.css` reúne ajustes globales fuera de las capas que aplican a toda la app.

## Archivos

Documentos, evidencias y fotos se eligen con `FilePicker`. Las imágenes se reducen y pasan a JPEG en el navegador y se envían como data URL dentro de la Server Action. El límite es de 20 MB en `next.config.ts` (la API acepta hasta 25 MB).
