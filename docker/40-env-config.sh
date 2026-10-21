#!/bin/sh
# Ejecutado por el entrypoint oficial de nginx antes de arrancar.
# Genera la configuración de runtime que lee src/config.ts.
set -eu

TARGET=/usr/share/nginx/html/env-config.js
API_URL_ESCAPED=$(printf '%s' "${API_URL:-}" | sed 's/\\/\\\\/g; s/"/\\"/g')

cat > "$TARGET" <<EOF
window.__APP_CONFIG__ = {
  API_URL: "${API_URL_ESCAPED}",
}
EOF

echo "env-config: API_URL=${API_URL:-<vacío>}"
