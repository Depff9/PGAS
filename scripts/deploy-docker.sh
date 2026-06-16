#!/usr/bin/env bash
# Деплой на VPS с Docker (backend + PostgreSQL) и статикой через host-nginx.
# Использование на сервере: ./scripts/deploy-docker.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

VITE_API_URL="${VITE_API_URL:-https://api.pgas-demo-site.online/api}"

if [ ! -f .env.production ]; then
  echo "Создайте .env.production из .env.production.example"
  exit 1
fi

echo "==> Pull latest code"
git pull --ff-only

echo "==> Build frontend"
npm ci
VITE_API_URL="$VITE_API_URL" npm run build

echo "==> Start / update containers"
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

echo "==> Health check"
sleep 3
curl -fsS http://127.0.0.1:4000/api/health | head -c 200
echo ""

echo "==> Reload nginx (if installed)"
if command -v nginx >/dev/null 2>&1; then
  nginx -t && systemctl reload nginx
fi

echo "Deploy finished. Open https://demo.pgas-demo-site.online"
