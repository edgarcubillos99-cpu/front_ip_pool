# ---------- Etapa 1: build de la SPA ----------
FROM node:24-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

# ---------- Etapa 2: Nginx sirviendo estáticos ----------
FROM nginx:stable-alpine

# URL del backend Go. Se inyecta en /env-config.js al arrancar el contenedor,
# así la misma imagen sirve para cualquier servidor sin recompilar.
ENV API_URL=http://localhost:8082

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/40-env-config.sh /docker-entrypoint.d/40-env-config.sh
RUN chmod +x /docker-entrypoint.d/40-env-config.sh

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz || exit 1
