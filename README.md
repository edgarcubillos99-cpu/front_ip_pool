# IP Pool · Torres — Dashboard NOC

Frontend (SPA estática) para la API Go [`Api-ObtenerIps-Torres`](../../go/Api-ObtenerIps-Torres).
Consume los endpoints de solo lectura del dashboard con autenticación JWT.

**Stack:** React 19 + Vite + TypeScript · TanStack Query v5 · React Router · Tailwind CSS v4 · Lucide · Axios · Nginx (Docker).

## Pantallas

| Ruta        | Contenido                                                                 | Endpoints                                 |
| ----------- | ------------------------------------------------------------------------- | ----------------------------------------- |
| `/login`    | Inicio de sesión                                                          | `POST /api/v1/auth/login`                 |
| `/`         | KPIs, distribución del pool, torres con stock bajo, últimas creadas/asignadas | `GET /api/v1/stats`, `/towers`, `/ips/latest` |
| `/ips`      | Pool completo con pestañas por estado, filtro por torre, búsqueda y paginación | `GET /api/v1/ips`                         |
| `/assigned` | Histórico de asignaciones con ticket de Ubersmith y comentario            | `GET /api/v1/assigned-ips`                |
| `/towers`   | Stock por torre (tarjetas o lista) con semáforo y filtro de stock bajo    | `GET /api/v1/towers`                      |
| `/users`    | Usuarios y MFA (solo admin)                                               | `GET/POST /api/v1/users`                  |

Los filtros viven en la URL (`/ips?status=available&torre=X&q=10.0`), así que las vistas se pueden compartir.
El auto-refresco (Off/15s/30s/1m/5m) se elige en la cabecera y se recuerda en el navegador.

**Login:** si el usuario no tiene MFA, entra con usuario y contraseña. Si tiene MFA, la API envía un código de 6 dígitos al correo y el panel pide ese código. En **Usuarios** (rol admin) se crean cuentas y se marca quién usa MFA. El usuario de `AUTH_USERNAME` del backend se crea solo al primer arranque, como admin sin MFA (sigue sirviendo a la app móvil).

Para que el correo salga, el backend necesita `SMTP_HOST` (y el resto de `SMTP_*`) en su `.env`. Sin SMTP se pueden crear usuarios, pero no se les puede activar MFA.
Si la API responde `401` o el token expira (24 h), se cierra la sesión y se vuelve a `/login`.

## Desarrollo

```bash
cp .env.example .env      # ajustar VITE_API_URL
npm install
npm run dev               # http://localhost:5173
```

El backend debe permitir el origen del frontend: `CORS_ALLOWED_ORIGINS=http://localhost:5173`.

Otros scripts: `npm run build` (typecheck + build a `dist/`), `npm run lint`, `npm run preview`.

## Despliegue con Docker

La URL de la API **no se compila dentro de la imagen**: se define en tiempo de ejecución con la
variable `API_URL`. Al arrancar, el contenedor genera `/env-config.js` (ver `docker/40-env-config.sh`),
así la misma imagen sirve para cualquier servidor.

### Con docker compose (en el servidor remoto)

```bash
git clone <repo> ip-pool-front && cd ip-pool-front

cat > .env <<EOF
API_URL=https://api-ips.tu-dominio.com
FRONT_PORT=8080
EOF

docker compose up -d --build
```

El dashboard queda en `http://IP_DEL_SERVIDOR:8080`.

### Con docker run

```bash
docker build -t ip-pool-front .
docker run -d --name ip-pool-front --restart unless-stopped \
  -p 8080:80 \
  -e API_URL=https://api-ips.tu-dominio.com \
  ip-pool-front
```

### Construir local y subir al servidor sin registry

```bash
docker build -t ip-pool-front .
docker save ip-pool-front | gzip | ssh usuario@servidor 'gunzip | docker load'
ssh usuario@servidor 'docker run -d --name ip-pool-front --restart unless-stopped -p 8080:80 -e API_URL=https://api-ips.tu-dominio.com ip-pool-front'
```

Para cambiar la URL de la API basta con recrear el contenedor con otro `API_URL`; no hace falta reconstruir.

### Requisitos en el backend Go

1. `API_URL` es la URL que usa **el navegador del usuario**, no la red interna de Docker
   (no usar nombres de servicio como `http://api:8082`).
2. En el `.env` del backend, agregar el origen exacto del dashboard (esquema + host + puerto, sin `/` final):

   ```env
   CORS_ALLOWED_ORIGINS=https://dashboard.tu-empresa.com,http://IP_DEL_FRONTEND:8080
   ```

3. Si el dashboard se sirve por HTTPS, la API también debe ir por HTTPS (el navegador bloquea contenido mixto).

### Nginx del contenedor

- Rutas de la SPA (`/ips`, `/towers`, …) responden `index.html` (`try_files`).
- `/assets/*` (con hash) se cachea 1 año; `index.html` y `env-config.js` nunca se cachean.
- Health check en `/healthz` (usado por el `HEALTHCHECK` de la imagen).
- Para TLS, poner delante un proxy inverso (Nginx/Traefik/Caddy del host) apuntando al puerto publicado.

## Estructura

```
src/
  api/          cliente Axios (JWT + 401), endpoints y hooks de TanStack Query
  components/   layout, guard de rutas, tabla, paginación, filtros, badges
  lib/          sesión (localStorage), auto-refresco, filtros en URL, utilidades
  pages/        Login, Dashboard, IPs, Assigned, Towers
  types/api.ts  espejo de los DTOs de Go (internal/ippool/query.go, internal/service/pool.go)
docker/40-env-config.sh   genera env-config.js al arrancar el contenedor
nginx.conf, Dockerfile, docker-compose.yml
```
