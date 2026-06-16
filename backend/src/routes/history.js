import { Router } from 'express';
import { prisma } from '../db.js';
import { authRequired, requireRoles } from '../middleware/auth.js';
import { createHttpError } from '../utils/http.js';

const router = Router();

router.use(authRequired);

const ALLOWED_ACTIONS = new Set([
  'create',
  'update',
  'delete',
  'review',
  'login',
  'logout',
  'register',
  'submit',
  'download',
]);

const ALLOWED_ENTITIES = new Set([
  'auth.login',
  'auth.logout',
  'auth.register',
  'regulations',
  'commission.review',
  'admin.users',
  'users',
  'faculties',
  'groups',
  'tooltips',
  'directions',
  'scoring',
  'submissions.submit',
  'application.attachment',
  'attachment.download',
  'general',
]);

router.get('/', requireRoles('admin', 'commission'), async (req, res, next) => {
  try {
    const take = req.auth.role === 'admin' ? 500 : 200;
    const entries = await prisma.historyEntry.findMany({
      orderBy: { createdAt: 'desc' },
      take,
    });
    res.json(entries);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRoles('admin', 'commission'), async (req, res, next) => {
  try {
    const payload = req.body || {};
    const action = String(payload.action || 'update').trim();
    const entity = String(payload.category || payload.entity || 'general').trim();
    const summary = String(payload.summary || '').trim();

    if (!ALLOWED_ACTIONS.has(action)) {
      throw createHttpError(400, 'Недопустимое действие для истории');
    }
    if (!ALLOWED_ENTITIES.has(entity)) {
      throw createHttpError(400, 'Недопустимая категория истории');
    }
    if (!summary) {
      throw createHttpError(400, 'Краткое описание изменения обязательно');
    }
    if (summary.length > 500) {
      throw createHttpError(400, 'Слишком длинное описание изменения');
    }

    const safePayload = {
      id: payload.id,
      category: entity,
      action,
      summary,
      userId: req.auth.id,
      userName: payload.userName ? String(payload.userName).slice(0, 200) : null,
      targetId: payload.targetId ? String(payload.targetId).slice(0, 100) : null,
      metadata: payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : null,
      snapshot:
        payload.snapshot && typeof payload.snapshot === 'object' ? payload.snapshot : null,
    };

    const entry = await prisma.historyEntry.create({
      data: {
        id: payload.id || `h${Date.now()}`,
        action,
        entity,
        payload: safePayload,
        createdBy: req.auth.id,
      },
    });
    res.status(201).json(entry);
  } catch (error) {
    next(error);
  }
});

export default router;
