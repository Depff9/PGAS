import { Router } from 'express';
import { prisma } from '../db.js';
import { authRequired, requireRoles } from '../middleware/auth.js';

const router = Router();

router.use(authRequired);

router.get('/', requireRoles('admin', 'commission'), async (_req, res, next) => {
  try {
    const entries = await prisma.historyEntry.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    res.json(entries);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRoles('admin', 'commission'), async (req, res, next) => {
  try {
    const payload = req.body || {};
    const entry = await prisma.historyEntry.create({
      data: {
        id: payload.id || `h${Date.now()}`,
        action: payload.action || 'update',
        entity: payload.category || payload.entity || 'general',
        payload: payload,
        createdBy: req.auth.id,
        createdAt: payload.createdAt ? new Date(payload.createdAt) : new Date(),
      },
    });
    res.status(201).json(entry);
  } catch (error) {
    next(error);
  }
});

export default router;
