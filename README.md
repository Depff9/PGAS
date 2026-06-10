# ПГАС — БрГУ

Электронная подача заявлений на повышенную государственную академическую стипендию в **ФГБОУ ВО «Братский государственный университет»**.

## Запуск

```bash
cd pgas-system
npm install
npm run dev
```

## Backend (PostgreSQL)

Добавлен backend в папке `backend` на **Express + Prisma + PostgreSQL**.

```bash
npm run backend:install
cd backend
cp .env.example .env
# указать DATABASE_URL на ваш PostgreSQL
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run dev
```

API будет доступен на `http://localhost:4000/api`.

## Демо (пароль `demo123`)

| Роль | Email |
|------|--------|
| Студент | `ivanov@student.brgu.ru` |
| Комиссия | `commission@brgu.ru` |
| Админ (программист) | `admin@brgu.ru` |

После обновления версии данных (`DATA_VERSION` в `dataSlice`) localStorage сбрасывается автоматически.

## Роли

**Студент** — таблица заявления (5×7 ячеек), файлы PDF/скан, уведомления об одобрении/отклонении/правках, рейтинг.

**Комиссия** — регламент, направления, рассмотрение достижений, правки с шаблонами, экспорт ведомости (CSV/PDF), история регламента.

**Администратор** — пользователи, факультеты, группы, матрица баллов, подсказки, статистика (без рассмотрения заявлений).

## Сброс данных

```js
Object.keys(localStorage).filter(k => k.startsWith('pgas_')).forEach(k => localStorage.removeItem(k));
location.reload();
```
