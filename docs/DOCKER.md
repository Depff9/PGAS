# Docker и CI/CD для ПГАС

## Зачем это вам

| Инструмент | Что даёт |
|------------|----------|
| **Docker (локально)** | Один раз `docker compose up` — поднимаются БД, API и сайт. У коллег и у вас одинаковая среда. |
| **Docker (VPS)** | Backend и PostgreSQL в контейнерах: проще обновлять, откатывать, переносить на другой сервер. |
| **CI (GitHub Actions)** | При каждом push проверяется lint, сборка фронта и Docker-образов — ошибки видны до деплоя. |
| **CD (Deploy workflow)** | Кнопка в GitHub → код на сервере обновляется автоматически (как ручной деплой, но без SSH вручную). |

**Ваши домены и nginx не ломаются:** SSL и `demo.pgas-demo-site.online` / `api.pgas-demo-site.online` по-прежнему на host-nginx. Docker заменяет **pm2 + локальный PostgreSQL**, а не весь сервер.

---

## Локальный запуск (полный стек)

Требуется: [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/macOS) или Docker Engine (Linux).

```bash
cd pgas-system
docker compose up --build
```

Откройте: **http://localhost:8080**  
API напрямую: **http://localhost:4000/api/health**

Первый запуск с демо-данными:

```bash
PGAS_SEED_ON_START=true docker compose up --build
```

Логин: `ivanov@student.brgu.ru` / `demo123`

Остановка:

```bash
docker compose down
```

Данные PostgreSQL сохраняются в volume `pgas_pgdata`. Полный сброс: `docker compose down -v`.

---

## Production на VPS (ваш текущий сервер)

### Схема

```
Браузер
  → demo.pgas-demo-site.online  → nginx (на хосте) → /var/www/pgas-system/dist
  → api.pgas-demo-site.online   → nginx (на хосте) → 127.0.0.1:4000 (Docker backend)
                                        ↓
                                 Docker: postgres + backend
```

### Первичная настройка (один раз)

1. Установите Docker на VPS:

```bash
curl -fsSL https://get.docker.com | sh
systemctl enable docker
```

2. Клонируйте/обновите проект в `/var/www/pgas-system`.

3. Создайте production-конфиг:

```bash
cp .env.production.example .env.production
nano .env.production   # JWT_SECRET, POSTGRES_PASSWORD, CORS_ORIGIN
```

4. Каталог для данных БД:

```bash
mkdir -p /var/lib/pgas/postgres
```

5. Первый деплой:

```bash
chmod +x scripts/deploy-docker.sh
PGAS_SEED_ON_START=true VITE_API_URL="https://api.pgas-demo-site.online/api" ./scripts/deploy-docker.sh
```

6. Убедитесь, что **host-nginx** для API проксирует на `127.0.0.1:4000` (как сейчас с pm2).  
   Frontend root — ` /var/www/pgas-system/dist`.

7. Остановите старый pm2-процесс (если был):

```bash
pm2 stop pgas-backend
pm2 delete pgas-backend
```

### Обычное обновление

```bash
cd /var/www/pgas-system
./scripts/deploy-docker.sh
```

Или через GitHub: **Actions → Deploy to VPS → Run workflow**.

---

**CI** и **CD** описаны в [`docs/CICD.md`](CICD.md). Кратко:

| Secret | Назначение |
|--------|------------|
| `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` | SSH на VPS |
| `VITE_API_URL` | URL API при сборке фронта |
| `DEPLOY_MODE` | `pm2` (default) или `docker` |

Workflow: `.github/workflows/ci.yml` — test на каждый PR/push, deploy на `main` после успешного test.

---

## Ручной деплой vs Docker

| | Ручной (pm2) | Docker |
|--|--------------|--------|
| Работает с вашими доменами | ✓ | ✓ (nginx на хосте) |
| Одинаково на всех ПК | ✗ | ✓ |
| Авто-миграции при старте | вручную | ✓ в entrypoint |
| CI проверяет сборку | ✗ | ✓ |
| Нужен Docker на VPS | ✗ | ✓ |

Можно **не включать CD** и пользоваться только Docker на VPS + ручным `./scripts/deploy-docker.sh` — CI всё равно будет ловить ошибки в GitHub.

---

## Частые проблемы

**502 на API** — контейнер backend не запущен: `docker compose -f docker-compose.prod.yml ps`  
**CORS** — `CORS_ORIGIN` в `.env.production` должен совпадать с URL фронта (без `/` в конце).  
**JWT ошибка при старте** — задайте длинный `JWT_SECRET` в `.env.production`.
