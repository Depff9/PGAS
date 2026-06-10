import { Router } from 'express';
import { prisma } from '../db.js';
import { authRequired, requireRoles } from '../middleware/auth.js';
import { createHttpError } from '../utils/http.js';

const router = Router();

router.use(authRequired);

router.get('/', async (req, res, next) => {
  try {
    const where = {};
    if (req.query.submissionId) where.submissionId = String(req.query.submissionId);
    if (req.auth.role === 'student') where.userId = req.auth.id;

    const achievements = await prisma.achievement.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }],
    });

    res.json(achievements);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRoles('student'), async (req, res, next) => {
  try {
    const body = req.body || {};
    const achievement = await prisma.achievement.create({
      data: {
        id: `ach-${Date.now()}`,
        submissionId: String(body.submissionId),
        userId: req.auth.id,
        directionId: String(body.directionId),
        slotIndex: Number(body.slotIndex || 0),
        title: String(body.title || ''),
        description: String(body.description || ''),
        attachments: Array.isArray(body.attachments) ? body.attachments : [],
        achievementLevel: body.achievementLevel || null,
        status: body.status || 'draft',
        score: body.score ?? null,
        finalScore: body.finalScore ?? null,
        revision: body.revision || null,
      },
    });
    res.status(201).json(achievement);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const existing = await prisma.achievement.findUnique({ where: { id } });
    if (!existing) throw createHttpError(404, 'Достижение не найдено');

    const isStudentOwner = req.auth.role === 'student' && existing.userId === req.auth.id;
    const isCommission = req.auth.role === 'commission' || req.auth.role === 'admin';
    if (!isStudentOwner && !isCommission) throw createHttpError(403, 'Нет прав на изменение');

    const updated = await prisma.achievement.update({
      where: { id },
      data: {
        title: body.title ?? undefined,
        description: body.description ?? undefined,
        attachments: body.attachments ?? undefined,
        achievementLevel: body.achievementLevel ?? undefined,
        status: body.status ?? undefined,
        score: body.score ?? undefined,
        finalScore: body.finalScore ?? undefined,
        revision: body.revision ?? undefined,
      },
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireRoles('student', 'admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.achievement.findUnique({ where: { id } });
    if (!existing) throw createHttpError(404, 'Достижение не найдено');

    if (req.auth.role === 'student' && existing.userId !== req.auth.id) {
      throw createHttpError(403, 'Нет прав на удаление');
    }

    await prisma.achievement.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
