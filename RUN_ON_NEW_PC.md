# Запуск на новом ПК (Windows)

Краткая инструкция для полного локального запуска (frontend + backend + PostgreSQL).

## 1) Установить ПО

- Node.js 20+
- PostgreSQL 16+ (pgAdmin по желанию)

## 2) Создать БД

Название БД: `pgas_system`

Если через `Query Tool`:

```sql
CREATE DATABASE pgas_system;
```

## 3) Настроить backend

```powershell
cd D:\VKR\Programma\pgas-system\backend
copy .env.example .env
```

Проверь в `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/pgas_system?schema=public"
CORS_ORIGIN="http://localhost:5173"
SUBMISSION_DEADLINE_ISO=""
```

## 4) Подготовить схему и данные

```powershell
cd D:\VKR\Programma\pgas-system\backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
```

## 5) Запустить backend

```powershell
cd D:\VKR\Programma\pgas-system\backend
npm run dev
```

Проверка: `http://localhost:4000/api/health`

## 6) Запустить frontend (в отдельном терминале)

```powershell
cd D:\VKR\Programma\pgas-system
npm install
npm run dev
```

Сайт: `http://localhost:5173`

## 7) Демо-аккаунты

Пароль для seed-пользователей: `demo123`

- `ivanov@student.brgu.ru` — студент
- `commission@brgu.ru` — комиссия
- `admin@brgu.ru` — админ

## Backup/Restore БД

Из папки `backend`:

```powershell
# backup
npm run db:backup

# restore
npm run db:restore -- -DumpFile "./backups/<your-file>.dump"
```
