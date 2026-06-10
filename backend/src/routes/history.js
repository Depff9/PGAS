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

export default router;
