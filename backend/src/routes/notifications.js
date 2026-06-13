import { Router } from 'express';
import { prisma } from '../db.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

router.use(authRequired);

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
