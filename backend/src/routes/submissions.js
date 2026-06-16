import { Router } from 'express';
import { prisma } from '../db.js';
import { authRequired, requireRoles } from '../middleware/auth.js';
import { createHttpError } from '../utils/http.js';
import { assertDeadlineOpen } from '../utils/deadline.js';
import { getCurrentAcademicYear } from '../utils/academicYear.js';
import {
  normalizeSubmissionPeriod,
  resolveCurrentSubmissionPeriod,
  getCurrentSubmissionPeriod,
} from '../utils/submissionPeriod.js';
import {
  assertAchievementDescription,
  assertAchievementTitle,
} from '../utils/achievementValidation.js';
import { enforceMinimumScoreRules } from '../utils/minScore.js';
import { recordAuditEntry } from '../utils/auditHistory.js';
import { formatUserName } from '../utils/userName.js';

const router = Router();

const studentUserSelect = {
  id: true,
  email: true,
  role: true,
  lastName: true,
  firstName: true,
  middleName: true,
  facultyId: true,
  group: true,
};

const commissionUserSelect = {
  ...studentUserSelect,
  recordBookNumber: true,
  studentCardNumber: true,
};

router.use(authRequired);

router.get('/', async (req, res, next) => {
  try {
    if (req.auth.role !== 'student') {
      await enforceMinimumScoreRules();
    }

    const where =
      req.auth.role === 'student'
        ? { userId: req.auth.id }
        : req.query.userId
          ? { userId: String(req.query.userId) }
          : {};

    const userSelect = req.auth.role === 'student' ? studentUserSelect : commissionUserSelect;

    const items = await prisma.submission.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        user: { select: userSelect },
      },
    });

    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRoles('student'), async (req, res, next) => {
  try {
    await assertDeadlineOpen();
    const body = req.body || {};
    const academicYear = String(body.academicYear || getCurrentAcademicYear());
    const period = normalizeSubmissionPeriod(
      body.period || (await resolveCurrentSubmissionPeriod())
    );

    const existing = await prisma.submission.findFirst({
      where: {
        userId: req.auth.id,
        academicYear,
        period,
      },
    });
    if (existing) {
      return res.status(200).json(existing);
    }

    const submission = await prisma.submission.create({
      data: {
        id: `sub-${req.auth.id}-${period}-${Date.now()}`,
        userId: req.auth.id,
        academicYear,
        period,
        status: 'draft',
        submittedAt: null,
      },
    });

    res.status(201).json(submission);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/status', requireRoles('commission'), async (req, res, next) => {
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

router.patch('/:id/submit', requireRoles('student'), async (req, res, next) => {
  try {
    await assertDeadlineOpen();
    const { id } = req.params;
    const submission = await prisma.submission.findUnique({ where: { id } });
    if (!submission) throw createHttpError(404, 'Заявка не найдена');
    if (submission.userId !== req.auth.id) throw createHttpError(403, 'Нет доступа к заявке');
    if (submission.status !== 'draft' && submission.status !== 'revision') {
      throw createHttpError(409, 'Заявление уже подано или закрыто для повторной подачи');
    }

    const achievements = await prisma.achievement.findMany({
      where: { submissionId: id, userId: req.auth.id },
    });
    const filled = achievements.filter((item) => String(item.title || '').trim());
    if (filled.length === 0) {
      throw createHttpError(400, 'Добавьте хотя бы одно достижение перед подачей заявления');
    }

    for (const item of filled) {
      if (item.status === 'draft' || item.status === 'revision') {
        assertAchievementDescription(item.description);
      }
    }

    const regulation = await prisma.regulation.findUnique({ where: { id: 1 } });
    const currentYear = getCurrentAcademicYear();
    const calendarPeriod = getCurrentSubmissionPeriod(regulation);

    const updated = await prisma.$transaction(async (tx) => {
      await tx.achievement.updateMany({
        where: {
          submissionId: id,
          userId: req.auth.id,
          status: { in: ['draft', 'revision'] },
        },
        data: { status: 'submitted', updatedAt: new Date(), revision: null },
      });

      return tx.submission.update({
        where: { id },
        data: {
          academicYear: currentYear,
          period: calendarPeriod,
          status: 'submitted',
          submittedAt: new Date(),
          updatedAt: new Date(),
        },
      });
    });

    const student = await prisma.user.findUnique({
      where: { id: req.auth.id },
      select: { lastName: true, firstName: true, middleName: true },
    });
    const attachmentNames = [
      ...new Set(
        achievements
          .flatMap((item) => (Array.isArray(item.attachments) ? item.attachments : []))
          .map((file) => String(file?.name || '').trim())
          .filter(Boolean)
      ),
    ];
    const periodLabel = submission.period === 'winter' ? 'зимней сессии' : 'летней сессии';
    let summary = `Подано заявление на ПГАС (${submission.academicYear}, ${periodLabel})`;
    if (attachmentNames.length === 1) {
      summary += `. К заявлению приложен файл «${attachmentNames[0]}»`;
    } else if (attachmentNames.length > 1) {
      summary += `. К заявлению приложены файлы: ${attachmentNames.map((name) => `«${name}»`).join(', ')}`;
    }

    await recordAuditEntry({
      action: 'submit',
      entity: 'submissions.submit',
      summary,
      createdBy: req.auth.id,
      userName: formatUserName(student),
      targetId: submission.id,
      metadata: {
        academicYear: submission.academicYear,
        period: submission.period,
        attachmentNames,
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
