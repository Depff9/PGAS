import { Router } from 'express';
import { prisma } from '../db.js';
import { authRequired, requireRoles } from '../middleware/auth.js';
import { createHttpError } from '../utils/http.js';
import { assertDeadlineOpen } from '../utils/deadline.js';

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
    assertDeadlineOpen();
    const body = req.body || {};
    const submission = await prisma.submission.findUnique({
      where: { id: String(body.submissionId) },
    });
    if (!submission) throw createHttpError(404, 'Заявка не найдена');
    if (submission.userId !== req.auth.id) throw createHttpError(403, 'Нет доступа к заявке');
    const achievement = await prisma.achievement.create({
      data: {
        id: String(body.id || `ach-${Date.now()}`),
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

    if (isStudentOwner) {
      assertDeadlineOpen();
      if (existing.status === 'submitted') {
        throw createHttpError(
          409,
          'Поданное достижение можно изменить только после возврата на доработку.'
        );
      }
    }

    const updateData = isStudentOwner
      ? {
          title: body.title ?? undefined,
          description: body.description ?? undefined,
          attachments: body.attachments ?? undefined,
          achievementLevel: body.achievementLevel ?? undefined,
          status: body.status ?? undefined,
          score: body.score ?? undefined,
          finalScore: body.finalScore ?? undefined,
          revision: body.revision ?? undefined,
        }
      : {
          status: body.status ?? undefined,
          score: body.score ?? undefined,
          finalScore: body.finalScore ?? undefined,
          revision: body.revision ?? undefined,
        };

    const updated = await prisma.achievement.update({
      where: { id },
      data: updateData,
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
    if (req.auth.role === 'student') {
      assertDeadlineOpen();
      if (existing.status === 'submitted') {
        throw createHttpError(
          409,
          'Поданное достижение нельзя удалить до возврата на доработку.'
        );
      }
    }

    await prisma.achievement.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
