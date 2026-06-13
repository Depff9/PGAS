# PGAS Backend (PostgreSQL + Express + Prisma)

Backend-составляющая для сайта ПГАС с ролевым доступом (student / commission / admin).

## Почему PostgreSQL

- Реляционная модель хорошо ложится на сущности: пользователи, заявки, достижения, направления, справочники.
- Надежные транзакции и ограничения целостности (FK, enum, unique).
- Удобно делать выборки для рейтинга, фильтров комиссии и отчетов.
- Prisma дает типобезопасный доступ к БД и быстрые миграции.

## Быстрый старт

1. Скопируйте env:

```bash
cp .env.example .env
```

2. Поднимите PostgreSQL и создайте базу `pgas_system`.

3. Установите зависимости:

```bash
npm install
```

4. Примените миграции и сиды:

```bash
npm run prisma:migrate -- --name init
npm run prisma:seed
```

5. Запустите сервер:

```bash
npm run dev
```

Сервер: `http://localhost:4000`, healthcheck: `GET /api/health`.

## Public bootstrap (без логина)

Для стартовой загрузки публичных данных добавлен маршрут:

- `GET /api/reference/public`

Он возвращает направления, факультеты, группы, тултипы, регламент и матрицу баллов.

## Основные маршруты

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`
- `GET /api/users` (admin/commission)
- `PATCH /api/users/:id` (admin)
- `PATCH /api/users/me/profile`
- `GET /api/reference/*` (directions, faculties, groups, tooltips, regulations, scoring-matrix)
- `GET /api/reference/public`
- `PATCH /api/reference/regulations` (commission/admin)
- `PATCH /api/reference/scoring-matrix` (commission/admin)
- `PATCH /api/reference/directions/:id` (commission/admin)
- `POST/PATCH/DELETE /api/reference/faculties*` (admin)
- `POST/DELETE /api/reference/groups*` (admin)
- `POST/PATCH/DELETE /api/reference/tooltips*` (admin)
- `GET /api/submissions`
- `POST /api/submissions` (student)
- `PATCH /api/submissions/:id/status` (commission/admin)
- `PATCH /api/submissions/:id/submit` (student)
- `GET /api/submissions/:id/achievements`
- `GET /api/achievements`
- `POST /api/achievements` (student)
- `PATCH /api/achievements/:id`
- `DELETE /api/achievements/:id` (student-owner/admin)
- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`
- `GET /api/history` (admin/commission)

## Backup/Restore PostgreSQL

Из папки `backend`:

```bash
# backup в ./backups
npm run db:backup

# restore из дампа
npm run db:restore -- -DumpFile "./backups/<file>.dump"
```

## Дедлайн подачи

Для жесткой блокировки отправки и редактирования достижений после срока укажите в `.env`:

```env
SUBMISSION_DEADLINE_ISO="2026-02-10T23:59:59.000Z"
```

Если переменная не задана, дедлайн-ограничение на backend отключено.

## Демо учетные записи после seed

Пароль: `demo123`

- `ivanov@student.brgu.ru` — student
- `commission@brgu.ru` — commission
- `admin@brgu.ru` — admin
