#!/usr/bin/env bash
# Деплой на VPS без Docker: host PostgreSQL + pm2 + host nginx.
# Использование: ./scripts/deploy-pm2.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

VITE_API_URL="${VITE_API_URL:-https://api.pgas-demo-site.online/api}"

if [ "${DEPLOY_SKIP_GIT:-0}" != "1" ]; then
  echo "==> Pull latest code"
  git pull --ff-only
fi

echo "==> Install dependencies"
npm ci
npm ci --prefix backend

echo "==> Migrate database"
npm run prisma:deploy --prefix backend

echo "==> Build frontend"
VITE_API_URL="$VITE_API_URL" npm run build

echo "==> Restart backend"
if pm2 describe pgas-backend >/dev/null 2>&1; then
  pm2 restart pgas-backend
else
  pm2 start backend/src/server.js --name pgas-backend
fi
pm2 save

echo "==> Health check"
sleep 2
curl -fsS http://127.0.0.1:4000/api/health | head -c 200
echo ""

echo "==> Reload nginx"
if command -v nginx >/dev/null 2>&1; then
  nginx -t && systemctl reload nginx
fi

echo "Deploy finished. Open https://demo.pgas-demo-site.online"
