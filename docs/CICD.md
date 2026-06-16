# CI/CD: полный гайд для VPS + домен

Быстрый путь: **~20 минут** (CI + автодеплой через pm2, без смены вашей текущей схемы).  
Полный путь с Docker: **~40 минут** (удобнее для передачи в университет).

Домены в примерах: `demo.pgas-demo-site.online` и `api.pgas-demo-site.online` — замените на свои.

---

## Что вы получите

| Компонент | Что делает |
|-----------|------------|
| **CI** (GitHub Actions) | При каждом push/PR: lint, сборка фронта, проверка Prisma и Docker-конфигов |
| **CD** | После успешного CI на `main` — SSH на VPS и запуск deploy-скрипта |
| **Deploy-скрипты** | `deploy-pm2.sh` (как сейчас) или `deploy-docker.sh` (контейнеры) |

---

## Архитектура (два варианта)

### Вариант A — pm2 (рекомендуется сейчас, быстрее)

У вас уже так работает сайт — ничего не ломаем.

```
demo.*  → nginx (SSL) → /var/www/pgas-system/dist
api.*   → nginx (SSL) → 127.0.0.1:4000 (pm2)
                          ↓
                    PostgreSQL на хосте
```

### Вариант B — Docker (для передачи в вуз)

```
demo.*  → nginx (SSL) → /var/www/pgas-system/dist
api.*   → nginx (SSL) → 127.0.0.1:4000 (Docker backend)
                          ↓
                    Docker: PostgreSQL + backend
```

> **Важно:** Docker поднимает **новую** БД в контейнере. Если на VPS уже есть данные в host-PostgreSQL — сначала сделайте `pg_dump`, либо оставайтесь на варианте A.

---

## Шаг 1. Подготовка репозитория (на ПК)

```bash
cd pgas-system
git add .
git commit -m "Add CI/CD pipelines and deploy scripts"
git push origin main
```

В репозитории уже есть:
- `.github/workflows/ci.yml` — CI + CD в одном workflow
- `scripts/deploy-pm2.sh` — деплой через pm2
- `scripts/deploy-docker.sh` — деплой через Docker
- `docker-compose.yml` / `docker-compose.prod.yml` — локально и на VPS

---

## Шаг 2. SSH-ключ для GitHub Actions

На **своём ПК** (PowerShell / Git Bash):

```bash
ssh-keygen -t ed25519 -C "github-actions-pgas" -f pgas-deploy-key -N ""
```

- `pgas-deploy-key` — **приватный** ключ → в GitHub Secrets  
- `pgas-deploy-key.pub` — **публичный** → на VPS

На **VPS**:

```bash
mkdir -p ~/.ssh
nano ~/.ssh/authorized_keys
# вставьте содержимое pgas-deploy-key.pub
chmod 600 ~/.ssh/authorized_keys
```

Проверка с ПК:

```bash
ssh -i pgas-deploy-key root@ВАШ_IP "echo ok"
```

---

## Шаг 3. Секреты в GitHub

Репозиторий → **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Значение | Обязательно |
|--------|----------|-------------|
| `VPS_HOST` | IP или домен VPS | да |
| `VPS_USER` | `root` (или ваш user) | да |
| `VPS_SSH_KEY` | содержимое `pgas-deploy-key` (приватный) | да |
| `VITE_API_URL` | `https://api.pgas-demo-site.online/api` | да |
| `VPS_APP_DIR` | `/var/www/pgas-system` | нет (есть default) |
| `DEPLOY_MODE` | `pm2` или `docker` | нет (default: `pm2`) |

---

## Шаг 4. Первый деплой на VPS

### Вариант A — pm2 (5 минут, если сервер уже настроен)

```bash
ssh root@ВАШ_IP
cd /var/www/pgas-system
git pull
chmod +x scripts/deploy-pm2.sh
VITE_API_URL="https://api.pgas-demo-site.online/api" ./scripts/deploy-pm2.sh
```

Убедитесь, что pm2 уже запущен:

```bash
pm2 status
curl http://127.0.0.1:4000/api/health
```

### Вариант B — Docker (первый раз)

```bash
# Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker

cd /var/www/pgas-system
cp .env.production.example .env.production
nano .env.production   # JWT_SECRET, POSTGRES_PASSWORD, CORS_ORIGIN

mkdir -p /var/lib/pgas/postgres

chmod +x scripts/deploy-docker.sh
PGAS_SEED_ON_START=true VITE_API_URL="https://api.pgas-demo-site.online/api" ./scripts/deploy-docker.sh

# Остановить старый pm2, если был
pm2 stop pgas-backend 2>/dev/null || true
pm2 delete pgas-backend 2>/dev/null || true
```

---

## Шаг 5. Nginx (пример конфигов)

Файлы в `docs/nginx/` — шаблоны. На VPS обычно `/etc/nginx/sites-available/`.

**Фронт** (`demo.pgas-demo-site.online`):

```nginx
server {
    listen 443 ssl http2;
    server_name demo.pgas-demo-site.online;

    ssl_certificate     /etc/letsencrypt/live/demo.pgas-demo-site.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/demo.pgas-demo-site.online/privkey.pem;

    root /var/www/pgas-system/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**API** (`api.pgas-demo-site.online`):

```nginx
server {
    listen 443 ssl http2;
    server_name api.pgas-demo-site.online;

    ssl_certificate     /etc/letsencrypt/live/api.pgas-demo-site.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.pgas-demo-site.online/privkey.pem;

    location /api/ {
        proxy_pass http://127.0.0.1:4000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 12m;
    }
}
```

```bash
nginx -t && systemctl reload nginx
```

SSL (если ещё нет):

```bash
certbot --nginx -d demo.pgas-demo-site.online -d api.pgas-demo-site.online
```

---

## Шаг 6. Как работает CI/CD после настройки

### Обычный цикл правок

1. Меняете код на ПК  
2. `git push origin main`  
3. GitHub Actions: job **test** (lint + build)  
4. Если test зелёный → job **deploy** (SSH + скрипт)  
5. Сайт обновлён за ~2–4 минуты  

### Ручной деплой из GitHub

**Actions → CI/CD → Run workflow** → выберите `pm2` или `docker`.

### Отключить автодеплой при push

В `.github/workflows/ci.yml` удалите job `deploy` или добавьте `if: github.event_name == 'workflow_dispatch'` только для deploy.

---

## Шаг 7. Передача университету

Что отдать админам вуза:

1. **Репозиторий** (GitHub/GitLab) с этим README и `docs/CICD.md`
2. **Секреты** — завести свои в их GitHub или передать доступ к VPS
3. **`.env.production`** на сервере (пароли, JWT) — **не в git**
4. **Демо-аккаунты** — в README
5. **Инструкция обновления:** «push в main → сайт обновится» или `./scripts/deploy-pm2.sh`

Для ИТ-службы вуза удобнее **Docker** (вариант B): один `docker compose`, проще перенос на другой сервер.

---

## Проверка файлов Docker (чеклист)

| Файл | Статус | Назначение |
|------|--------|------------|
| `backend/Dockerfile` | OK | API-образ, копирует shared-код из `src/utils`, `src/mock` |
| `docker/backend-entrypoint.sh` | OK | `migrate deploy` + `prisma generate` + старт |
| `docker/frontend.Dockerfile` | OK | Сборка Vite + nginx (для локального стека) |
| `docker-compose.yml` | OK | Локально: postgres + backend + frontend `:8080` |
| `docker-compose.prod.yml` | OK | VPS: postgres + backend на `127.0.0.1:4000` |
| `.dockerignore` | OK | Исключает `node_modules`, `.env` |
| `.env.production.example` | OK | Шаблон секретов для Docker |

Локально (нужен Docker Desktop):

```bash
docker compose up --build
# http://localhost:8080
```

---

## Частые проблемы

| Симптом | Решение |
|---------|---------|
| Deploy падает на SSH | Проверьте `VPS_HOST`, ключ в Secrets, `authorized_keys` на VPS |
| `Unknown argument 'period'` при seed | `cd backend && npx prisma generate` |
| 502 на API | `pm2 status` или `docker compose -f docker-compose.prod.yml ps` |
| CORS | `CORS_ORIGIN` = URL фронта без `/` в конце |
| Фронт старый | Проверьте `VITE_API_URL` при сборке |
| CI падает на prod compose | Нужен `POSTGRES_PASSWORD` — в workflow уже добавлен для проверки |

---

## Команды на каждый день

```bash
# На VPS вручную (pm2)
./scripts/deploy-pm2.sh

# На VPS вручную (docker)
./scripts/deploy-docker.sh

# Логи
pm2 logs pgas-backend --lines 50
docker compose -f docker-compose.prod.yml logs -f backend

# Health
curl https://api.pgas-demo-site.online/api/health
```

---

## Что выбрать

| Критерий | pm2 | Docker |
|----------|-----|--------|
| Скорость настройки | быстрее | дольше |
| У вас уже работает | да | нужна миграция БД |
| Передача в вуз | ок | лучше |
| Откат версии | git + redeploy | образы + compose |

**Сейчас:** `DEPLOY_MODE=pm2` (или секрет не задавать).  
**Позже для вуза:** перейти на Docker по [`docs/DOCKER.md`](DOCKER.md).
