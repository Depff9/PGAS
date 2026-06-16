import { Router } from 'express';
import { prisma } from '../db.js';
import { authRequired, requireRoles } from '../middleware/auth.js';
import { assertCommissionDirectionAccess } from '../middleware/commission.js';
import { createHttpError } from '../utils/http.js';
import { assertDeadlineOpen } from '../utils/deadline.js';
import { assertValidAttachments } from '../utils/attachments.js';
import {
  assertAchievementDescription,
  assertAchievementTitle,
} from '../utils/achievementValidation.js';
import { recordAuditEntry } from '../utils/auditHistory.js';
import { formatUserName } from '../utils/userName.js';
import { sanitizeDownloadFilename } from '../utils/downloadFilename.js';

const router = Router();

function deriveSubmissionStatus(achievements) {
  const filled = achievements.filter((item) => String(item.title || '').trim());
  if (filled.length === 0) return 'draft';
  if (filled.every((item) => item.status === 'draft')) return 'draft';
  if (filled.some((item) => item.status === 'revision')) return 'revision';
  if (filled.some((item) => item.status === 'submitted')) return 'submitted';
  if (filled.every((item) => item.status === 'approved')) return 'approved';
  if (filled.every((item) => item.status === 'rejected')) return 'rejected';
  return 'submitted';
}

async function syncSubmissionStatusById(submissionId) {
  if (!submissionId) return null;
  const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
  if (!submission) return null;
  const achievements = await prisma.achievement.findMany({ where: { submissionId } });
  const nextStatus = deriveSubmissionStatus(achievements);
  if (submission.status === nextStatus) return submission;
  return prisma.submission.update({
    where: { id: submissionId },
    data: {
      status: nextStatus,
      updatedAt: new Date(),
      submittedAt: nextStatus === 'submitted' ? submission.submittedAt ?? new Date() : null,
    },
  });
}

function listAttachments(raw) {
  return Array.isArray(raw) ? raw : [];
}

async function auditNewAttachments({ attachments, existingAttachments, userId, achievement, submissionId }) {
  const existingIds = new Set(existingAttachments.map((item) => item.id));
  const actor = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastName: true, firstName: true, middleName: true },
  });

  for (const file of attachments) {
    if (existingIds.has(file.id)) continue;
    await recordAuditEntry({
      action: 'create',
      entity: 'application.attachment',
      summary: `К заявлению приложен файл «${file.name}»`,
      createdBy: userId,
      userName: formatUserName(actor),
      targetId: submissionId || achievement.submissionId,
      metadata: {
        achievementId: achievement.id,
        attachmentId: file.id,
        fileName: file.name,
      },
    });
  }
}

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
    await assertDeadlineOpen();
    const body = req.body || {};
    const submission = await prisma.submission.findUnique({
      where: { id: String(body.submissionId) },
    });
    if (!submission) throw createHttpError(404, 'Заявка не найдена');
    if (submission.userId !== req.auth.id) throw createHttpError(403, 'Нет доступа к заявке');
    if (submission.status !== 'draft' && submission.status !== 'revision') {
      throw createHttpError(409, 'Нельзя добавлять достижения в уже поданное заявление');
    }

    const title = assertAchievementTitle(body.title);
    const description = assertAchievementDescription(body.description);
    const attachments = assertValidAttachments(body.attachments ?? []);

    const achievement = await prisma.achievement.create({
      data: {
        id: String(body.id || `ach-${Date.now()}`),
        submissionId: String(body.submissionId),
        userId: req.auth.id,
        directionId: String(body.directionId),
        slotIndex: Number(body.slotIndex || 0),
        title,
        description,
        attachments,
        achievementLevel: body.achievementLevel || null,
        status: 'draft',
        score: null,
        finalScore: null,
        revision: null,
      },
    });

    if (attachments.length > 0) {
      await auditNewAttachments({
        attachments,
        existingAttachments: [],
        userId: req.auth.id,
        achievement,
        submissionId: submission.id,
      });
    }

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
    const isCommission = req.auth.role === 'commission';
    if (!isStudentOwner && !isCommission) {
      throw createHttpError(403, 'Нет прав на изменение');
    }

    if (isCommission) {
      assertCommissionDirectionAccess(req.auth, existing.directionId);
    }

    if (isStudentOwner) {
      await assertDeadlineOpen();
      const submission = await prisma.submission.findUnique({
        where: { id: existing.submissionId },
      });
      if (submission?.status !== 'draft' && submission?.status !== 'revision') {
        throw createHttpError(409, 'Заявление уже подано. Изменения недоступны до возврата на доработку.');
      }
      if (existing.status === 'submitted') {
        throw createHttpError(
          409,
          'Поданное достижение можно изменить только после возврата на доработку.'
        );
      }
      if (existing.status === 'approved' || existing.status === 'rejected') {
        throw createHttpError(409, 'Это достижение уже рассмотрено комиссией');
      }
    }

    const updateData = isStudentOwner
      ? (() => {
          const data = {};
          if (body.title != null) data.title = assertAchievementTitle(body.title);
          if (body.description != null) {
            data.description = assertAchievementDescription(body.description);
          }
          if (body.attachments != null) {
            data.attachments = assertValidAttachments(body.attachments);
          }
          if (body.achievementLevel != null) data.achievementLevel = body.achievementLevel;
          data.status = 'draft';
          return data;
        })()
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

    if (isStudentOwner || isCommission) {
      await syncSubmissionStatusById(existing.submissionId);
    }

    if (isStudentOwner && updateData.attachments) {
      await auditNewAttachments({
        attachments: updateData.attachments,
        existingAttachments: listAttachments(existing.attachments),
        userId: req.auth.id,
        achievement: existing,
        submissionId: existing.submissionId,
      });
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.get(
  '/:id/attachments/:attachmentId/download',
  requireRoles('commission', 'admin'),
  async (req, res, next) => {
    try {
      const { id, attachmentId } = req.params;
      const achievement = await prisma.achievement.findUnique({ where: { id } });
      if (!achievement) throw createHttpError(404, 'Достижение не найдено');

      if (req.auth.role === 'commission') {
        assertCommissionDirectionAccess(req.auth, achievement.directionId);
      }

      const attachments = listAttachments(achievement.attachments);
      const file = attachments.find((item) => item.id === attachmentId);
      if (!file) throw createHttpError(404, 'Вложение не найдено');

      const match = String(file.dataUrl || '').match(/^data:([^;]+);base64,(.+)$/i);
      if (!match) throw createHttpError(400, 'Некорректное содержимое файла');

      const student = await prisma.user.findUnique({
        where: { id: achievement.userId },
        select: { lastName: true, firstName: true, middleName: true },
      });
      const actor = await prisma.user.findUnique({
        where: { id: req.auth.id },
        select: { lastName: true, firstName: true, middleName: true },
      });

      await recordAuditEntry({
        action: 'download',
        entity: 'attachment.download',
        summary: `Скачан файл «${file.name}» (заявление студента ${formatUserName(student)})`,
        createdBy: req.auth.id,
        userName: formatUserName(actor),
        targetId: achievement.submissionId,
        metadata: {
          achievementId: achievement.id,
          attachmentId: file.id,
          fileName: file.name,
        },
      });

      const safeName = sanitizeDownloadFilename(file.name);
      const buffer = Buffer.from(match[2], 'base64');
      res.setHeader('Content-Type', file.mimeType || match[1]);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename*=UTF-8''${encodeURIComponent(safeName)}`
      );
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/:id', requireRoles('student', 'admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.achievement.findUnique({ where: { id } });
    if (!existing) throw createHttpError(404, 'Достижение не найдено');

    if (req.auth.role === 'student' && existing.userId !== req.auth.id) {
      throw createHttpError(403, 'Нет прав на удаление');
    }
    if (req.auth.role === 'student') {
      await assertDeadlineOpen();
      const submission = await prisma.submission.findUnique({
        where: { id: existing.submissionId },
      });
      if (submission?.status !== 'draft' && submission?.status !== 'revision') {
        throw createHttpError(409, 'Нельзя удалять достижения из уже поданного заявления');
      }
      if (existing.status === 'submitted') {
        throw createHttpError(
          409,
          'Поданное достижение нельзя удалить до возврата на правки.'
        );
      }
    }

    await prisma.achievement.delete({ where: { id } });
    await syncSubmissionStatusById(existing.submissionId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
