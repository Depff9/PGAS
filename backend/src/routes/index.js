import { Router } from 'express';
import authRoutes from './auth.js';
import userRoutes from './users.js';
import referenceRoutes from './reference.js';
import submissionRoutes from './submissions.js';
import achievementRoutes from './achievements.js';
import notificationRoutes from './notifications.js';
import historyRoutes from './history.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'pgas-backend' });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/reference', referenceRoutes);
router.use('/submissions', submissionRoutes);
router.use('/achievements', achievementRoutes);
router.use('/notifications', notificationRoutes);
router.use('/history', historyRoutes);

export default router;
