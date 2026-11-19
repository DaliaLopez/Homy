# Homy · Frontend

Interfaz de Homy en **Next.js 16** (App Router). Consume la API de NestJS desplegada en Render.

## Puesta en marcha

```bash
npm ci
cp .env.example .env.local   # HOMY_API_URL=https://homy-backend-qph1.onrender.com
npm run dev                  # http://localhost:3001
```

`HOMY_API_URL` solo la lee el servidor de Next.js; el navegador nunca llama a la API ni ve el token.

Comprobaciones: `npm run lint`, `npx tsc --noEmit` y `npm run build`.

## Sesión, cookies y roles

Sigue el patrón de las clases (Next.js II–IV):

1. **Login** (`src/shared/actions/auth.ts`): una Server Action envía el correo y la contraseña a `POST /auth/login` y guarda el JWT en la cookie `homy_token` (`httpOnly`, `sameSite: lax`, `secure` en producción, misma duración que el token).
2. **Peticiones privadas** (`src/lib/homy-api.ts`, `server-only`): `homyFetch` lee la cookie, envía `Authorization: Bearer …` y vuelve a `/login` si NestJS responde 401.
3. **Roles** (`src/lib/session.ts`): `requireRole()` consulta `GET /auth/me` (una vez por petición) y se usa en los layouts, en las páginas y en cada Server Action. Con otro rol se redirige a su propio inicio.
4. **`src/proxy.ts`**: primera barrera; sin cookie no se entra a `/my/*`, `/worker/*` ni `/admin/*`.
5. **Cerrar sesión**: borra la cookie y vuelve a `/login`.

El backend vuelve a validar el rol en cada endpoint: ocultar un enlace no protege la API.

| Rol | Inicio | Áreas |
|---|---|---|
| Visitante / cliente | `/` | `/`, `/workers`, `/workers/[id]` (públicas) y `/my/*` (solo cliente) |
| Trabajador | `/worker` | `/worker/*` |
| Administrador | `/admin` | `/admin/*` |

## Estructura

El código está organizado **por rol**: cada rol tiene en su carpeta de `app/` sus páginas, sus componentes (`_components/`) y sus Server Actions (`_actions/`). Las carpetas que empiezan con `_` no crean rutas; las que van entre `( )` no aparecen en la URL.

```
src/
├── proxy.ts                     # sin cookie → /login
├── app/
│   ├── (auth)/                  # /login, /register
│   │   └── _components/         # formularios de acceso
│   ├── (public)/                # inicio, catálogo y perfil del profesional
│   │   └── _components/         # catálogo, tarjeta del profesional, favoritos
│   ├── (client)/my/             # CLIENTE: solicitudes, reportes y perfil
│   │   ├── _components/         # formulario de nueva solicitud
│   │   └── _actions/            # crear solicitud, horarios libres, calificar
│   ├── worker/                  # TRABAJADOR: verificación, servicios, agenda, solicitudes…
│   │   ├── _components/         # availability/, services/, verification/
│   │   └── _actions/            # availability, services, verification, requests
│   ├── admin/                   # ADMIN: verificaciones, servicios, reportes, usuarios…
│   │   ├── _components/         # tablas, revisiones, encabezado del admin
│   │   └── _actions/            # admin
│   └── globals.css              # tokens, reset y layout
├── shared/                      # lo que usan DOS O MÁS roles
│   ├── ui/                      # piezas básicas: icon, modal, notice, avatar, stars…
│   ├── layout/                  # app-shell, navegación, notificaciones
│   ├── requests/                # detalle y tablero de solicitudes (cliente y trabajador)
│   ├── reports/                 # reportes (cliente, trabajador y admin)
│   ├── profile/                 # perfil (los tres roles)
│   └── actions/                 # auth, profile, reports, cancelar solicitud
├── lib/                         # homy-api, session, data (lecturas con cache), formatos
├── styles/                      # components.css (piezas de la app) y screens.css (archivos adjuntos y pantallas de acceso)
└── types/                       # tipos de los datos de la API
```

**Regla para saber dónde va algo nuevo:** si lo usa un solo rol, va en la carpeta de ese rol (`_components/` o `_actions/`). Si lo usan dos o más, va en `shared/`.

Los estilos son CSS normal (sin Tailwind), mobile first, con cortes en 768 px y 1024 px. Cliente y trabajador usan la barra superior en pill y, en móvil, la barra inferior flotante; administración tiene su propio encabezado con menú desplegable en pantallas estrechas. Bienvenida, login y registro siguen el diseño de `recursos-ui/auth-correcciones`.

## Archivos

Documentos, evidencias y fotos se eligen con `FilePicker`: las imágenes se reducen y pasan a JPEG en el navegador y se envían como data URL dentro de la Server Action (límite de 20 MB en `next.config.ts`).

Soporte por WhatsApp: `src/lib/support.ts` → https://wa.me/573184044556
