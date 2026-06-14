import { Router } from 'express';
import { prisma } from '../db.js';
import { authRequired, requireRoles } from '../middleware/auth.js';
import { createHttpError } from '../utils/http.js';

const router = Router();

router.use(authRequired);

function normalizeNotificationInput(raw, fallbackUserId) {
  const userId = String(raw?.userId || fallbackUserId || '').trim();
  const title = String(raw?.title || '').trim();
  const body = String(raw?.body || '').trim();
  const type = String(raw?.type || 'info').trim();

  if (!userId) throw createHttpError(400, 'userId обязателен');
  if (!title) throw createHttpError(400, 'Заголовок уведомления обязателен');
  if (!body) throw createHttpError(400, 'Текст уведомления обязателен');
  if (title.length > 200 || body.length > 2000) {
    throw createHttpError(400, 'Слишком длинный текст уведомления');
  }

  return {
    id: String(raw?.id || `n${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    userId,
    type,
    title,
    body,
    achievementId: raw?.achievementId ? String(raw.achievementId) : null,
    link: raw?.link ? String(raw.link).slice(0, 500) : null,
    read: false,
  };
}

router.get('/', async (req, res, next) => {
  try {
    const items = await prisma.notification.findMany({
      where: { userId: req.auth.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRoles('admin', 'commission'), async (req, res, next) => {
  try {
    const data = normalizeNotificationInput(req.body || {});
    const target = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!target) throw createHttpError(404, 'Получатель не найден');

    const created = await prisma.notification.create({ data });
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

router.post('/bulk', requireRoles('admin', 'commission'), async (req, res, next) => {
  try {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (items.length === 0) throw createHttpError(400, 'Список уведомлений пуст');
    if (items.length > 500) throw createHttpError(400, 'Слишком много уведомлений за один запрос');

    const normalized = items.map((item) => normalizeNotificationInput(item));
    const userIds = [...new Set(normalized.map((item) => item.userId))];
    const existingUsers = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true },
    });
    if (existingUsers.length !== userIds.length) {
      throw createHttpError(400, 'Один или несколько получателей не найдены');
    }

    await prisma.notification.createMany({ data: normalized });
    res.status(201).json({ created: normalized.length });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/read', async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.notification.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.auth.id) {
      return res.status(404).json({ error: 'Уведомление не найдено' });
    }
    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

export default router;
