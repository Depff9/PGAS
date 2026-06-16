import { Router } from 'express';
import { prisma } from '../db.js';
import { authRequired, requireRoles } from '../middleware/auth.js';
import { requireCommissionPermission } from '../middleware/commission.js';
import { createHttpError } from '../utils/http.js';
import { prepareRegulationPayload } from '../../../src/utils/submissionDeadlines.js';
import { getAcademicYearVariants } from '../utils/academicYear.js';
import { resolveCurrentSubmissionPeriod } from '../utils/submissionPeriod.js';
import { enforceMinimumScoreRules } from '../utils/minScore.js';

const router = Router();

router.get('/public', async (_req, res, next) => {
  try {
    const [directions, faculties, groups, tooltips, regulations] = await Promise.all([
      prisma.direction.findMany({ orderBy: { id: 'asc' } }),
      prisma.faculty.findMany({ orderBy: { shortName: 'asc' } }),
      prisma.group.findMany({ orderBy: { name: 'asc' } }),
      prisma.tooltip.findMany({ orderBy: { id: 'asc' } }),
      prisma.regulation.findUnique({ where: { id: 1 } }),
    ]);

    res.json({
      directions,
      faculties,
      groups,
      tooltips,
      regulations,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/students', authRequired, requireRoles('admin', 'commission'), async (_req, res, next) => {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'student' },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      select: {
        id: true,
        role: true,
        lastName: true,
        firstName: true,
        middleName: true,
        facultyId: true,
        group: true,
      },
    });
    res.json(students);
  } catch (error) {
    next(error);
  }
});

router.get('/rating', authRequired, async (_req, res, next) => {
  try {
    await enforceMinimumScoreRules();

    const currentAcademicYears = getAcademicYearVariants();
    const currentPeriod = await resolveCurrentSubmissionPeriod();
    const [students, submissions, achievements] = await Promise.all([
      prisma.user.findMany({
        where: { role: 'student' },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        select: {
          id: true,
          lastName: true,
          firstName: true,
          middleName: true,
          facultyId: true,
          group: true,
        },
      }),
      prisma.submission.findMany({
        where: {
          status: { notIn: ['draft', 'rejected'] },
          academicYear: { in: currentAcademicYears },
          period: currentPeriod,
        },
        select: { userId: true, id: true, status: true },
      }),
      prisma.achievement.findMany({
        where: {
          status: { in: ['submitted', 'approved'] },
        },
        select: {
          userId: true,
          submissionId: true,
          title: true,
          status: true,
          score: true,
          finalScore: true,
        },
      }),
    ]);

    const currentSubmissionIds = new Set(submissions.map((s) => s.id));
    const submittedUserIds = new Set(submissions.map((s) => s.userId));
    const scoreByUser = new Map();
    const countByUser = new Map();

    achievements.forEach((item) => {
      if (!currentSubmissionIds.has(item.submissionId)) return;
      const normalizedTitle = String(item.title || '').trim();
      if (!normalizedTitle) return;
      const score = item.status === 'approved' ? Number(item.finalScore ?? item.score ?? 0) : 0;
      if (score <= 0) return;
      submittedUserIds.add(item.userId);
      scoreByUser.set(item.userId, (scoreByUser.get(item.userId) || 0) + score);
      countByUser.set(item.userId, (countByUser.get(item.userId) || 0) + 1);
    });

    const rows = students
      .filter((student) => submittedUserIds.has(student.id))
      .map((student) => ({
        userId: student.id,
        fullName: [student.lastName, student.firstName, student.middleName].filter(Boolean).join(' '),
        facultyId: student.facultyId || null,
        group: student.group || '',
        totalScore: scoreByUser.get(student.id) || 0,
        achievementsCount: countByUser.get(student.id) || 0,
      }))
      .filter((row) => row.totalScore >= 25)
      .sort(
        (a, b) =>
          b.totalScore - a.totalScore ||
          a.fullName.localeCompare(b.fullName, 'ru')
      )
      .map((row, index) => ({ ...row, place: index + 1 }));

    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get('/directions', authRequired, async (_req, res, next) => {
  try {
    const data = await prisma.direction.findMany({ orderBy: { id: 'asc' } });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post(
  '/directions',
  authRequired,
  requireRoles('commission'),
  requireCommissionPermission('canEditDirections'),
  async (req, res, next) => {
    try {
      const payload = req.body || {};
      const created = await prisma.direction.create({
        data: {
          id: payload.id || `d${Date.now()}`,
          title: String(payload.title || '').trim(),
          shortTitle: String(payload.shortTitle || '').trim(),
          description: String(payload.description || '').trim(),
          icon: payload.icon || null,
          active: payload.active ?? true,
        },
      });
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  '/directions/:id',
  authRequired,
  requireRoles('commission'),
  requireCommissionPermission('canEditDirections'),
  async (req, res, next) => {
    try {
      const updated = await prisma.direction.update({
        where: { id: req.params.id },
        data: {
          title: req.body?.title,
          shortTitle: req.body?.shortTitle,
          description: req.body?.description,
          icon: req.body?.icon,
          active: req.body?.active,
        },
      });
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
);

router.get('/faculties', authRequired, async (_req, res, next) => {
  try {
    const data = await prisma.faculty.findMany({ orderBy: { shortName: 'asc' } });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post('/faculties', authRequired, requireRoles('admin'), async (req, res, next) => {
  try {
    const created = await prisma.faculty.create({
      data: {
        id: req.body?.id || `f${Date.now()}`,
        shortName: String(req.body?.shortName || '').trim(),
        name: String(req.body?.name || '').trim(),
      },
    });
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

router.patch('/faculties/:id', authRequired, requireRoles('admin'), async (req, res, next) => {
  try {
    const updated = await prisma.faculty.update({
      where: { id: req.params.id },
      data: {
        shortName: req.body?.shortName,
        name: req.body?.name,
      },
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.delete('/faculties/:id', authRequired, requireRoles('admin'), async (req, res, next) => {
  try {
    await prisma.faculty.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get('/groups', authRequired, async (_req, res, next) => {
  try {
    const data = await prisma.group.findMany({ orderBy: { name: 'asc' } });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post('/groups', authRequired, requireRoles('admin'), async (req, res, next) => {
  try {
    const created = await prisma.group.create({
      data: {
        id: req.body?.id || `g${Date.now()}`,
        name: String(req.body?.name || '').trim(),
        facultyId: String(req.body?.facultyId || ''),
      },
    });
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

router.delete('/groups/:id', authRequired, requireRoles('admin'), async (req, res, next) => {
  try {
    await prisma.group.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get('/tooltips', authRequired, async (_req, res, next) => {
  try {
    const data = await prisma.tooltip.findMany({ orderBy: { id: 'asc' } });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post('/tooltips', authRequired, requireRoles('admin'), async (req, res, next) => {
  try {
    const created = await prisma.tooltip.create({
      data: {
        id: req.body?.id || `t${Date.now()}`,
        fieldKey: String(req.body?.fieldKey || ''),
        label: String(req.body?.label || ''),
        text: String(req.body?.text || ''),
      },
    });
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

router.patch('/tooltips/:id', authRequired, requireRoles('admin'), async (req, res, next) => {
  try {
    const updated = await prisma.tooltip.update({
      where: { id: req.params.id },
      data: {
        fieldKey: req.body?.fieldKey,
        label: req.body?.label,
        text: req.body?.text,
      },
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.delete('/tooltips/:id', authRequired, requireRoles('admin'), async (req, res, next) => {
  try {
    await prisma.tooltip.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get('/regulations', authRequired, async (_req, res, next) => {
  try {
    const regulation = await prisma.regulation.findUnique({ where: { id: 1 } });
    res.json(regulation);
  } catch (error) {
    next(error);
  }
});

router.patch(
  '/regulations',
  authRequired,
  requireRoles('commission'),
  requireCommissionPermission('canEditRegulations'),
  async (req, res, next) => {
    try {
      const payload = req.body || {};
      const prepared = prepareRegulationPayload(
        {
          title: payload.title,
          sections: payload.sections,
          directionLimits: payload.directionLimits,
          defaultMaxPerDirection: payload.defaultMaxPerDirection,
          eventLevels: payload.eventLevels,
        },
        payload.submissionDeadlines
      );

      if (!prepared.valid) {
        throw createHttpError(400, prepared.message);
      }

      const nextPayload = prepared.payload;
      const regulation = await prisma.regulation.upsert({
        where: { id: 1 },
        create: {
          id: 1,
          title: nextPayload.title || 'Регламент ПГАС',
          updatedAt: new Date(),
          updatedBy: req.auth.id,
          defaultMaxPerDirection: Number(nextPayload.defaultMaxPerDirection || 7),
          directionLimits: nextPayload.directionLimits || {},
          submissionDeadlines: nextPayload.submissionDeadlines,
          eventLevels: nextPayload.eventLevels || payload.eventLevels || [],
          sections: nextPayload.sections || [],
        },
        update: {
          title: nextPayload.title,
          updatedAt: new Date(),
          updatedBy: req.auth.id,
          defaultMaxPerDirection: nextPayload.defaultMaxPerDirection,
          directionLimits: nextPayload.directionLimits,
          submissionDeadlines: nextPayload.submissionDeadlines,
          eventLevels: nextPayload.eventLevels ?? payload.eventLevels,
          sections: nextPayload.sections,
        },
      });

      res.json(regulation);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
