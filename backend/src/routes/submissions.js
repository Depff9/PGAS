import { Router } from 'express';
import { prisma } from '../db.js';
import { authRequired, requireRoles } from '../middleware/auth.js';
import { createHttpError } from '../utils/http.js';

const router = Router();

router.use(authRequired);

router.get('/', async (req, res, next) => {
  try {
    const where =
      req.auth.role === 'student'
        ? { userId: req.auth.id }
        : req.query.userId
          ? { userId: String(req.query.userId) }
          : {};

    const items = await prisma.submission.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            lastName: true,
            firstName: true,
            middleName: true,
            facultyId: true,
            group: true,
            recordBookNumber: true,
            studentCardNumber: true,
            permissions: true,
          },
        },
      },
    });

    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRoles('student'), async (req, res, next) => {
  try {
    const body = req.body || {};
    const existing = await prisma.submission.findFirst({
      where: {
        userId: req.auth.id,
        academicYear: String(body.academicYear || '2025-2026'),
      },
    });
    if (existing) {
      return res.status(200).json(existing);
    }
    const submission = await prisma.submission.create({
      data: {
        id: `sub-${req.auth.id}-${Date.now()}`,
        userId: req.auth.id,
        academicYear: String(body.academicYear || '2025-2026'),
        status: body.status || 'draft',
        submittedAt: body.submittedAt ? new Date(body.submittedAt) : null,
      },
    });

    res.status(201).json(submission);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/status', requireRoles('commission', 'admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const status = String(req.body?.status || '').trim();
    if (!status) throw createHttpError(400, 'Новый статус обязателен');

    const updated = await prisma.submission.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
        submittedAt: status === 'submitted' ? new Date() : undefined,
      },
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.get('/:id/achievements', async (req, res, next) => {
  try {
    const { id } = req.params;
    const submission = await prisma.submission.findUnique({ where: { id } });
    if (!submission) throw createHttpError(404, 'Заявка не найдена');

    if (req.auth.role === 'student' && submission.userId !== req.auth.id) {
      throw createHttpError(403, 'Нет доступа к заявке');
    }

    const achievements = await prisma.achievement.findMany({
      where: { submissionId: id },
      orderBy: [{ directionId: 'asc' }, { slotIndex: 'asc' }],
    });
    res.json(achievements);
  } catch (error) {
    next(error);
  }
});

export default router;
