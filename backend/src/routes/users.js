import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db.js';
import { authRequired, requireRoles } from '../middleware/auth.js';
import { createHttpError, pickUserSafeFields } from '../utils/http.js';
import { assertValidPersonName } from '../utils/personName.js';

const router = Router();

router.use(authRequired);

router.get('/', requireRoles('admin', 'commission'), async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: [{ role: 'asc' }, { lastName: 'asc' }],
    });
    res.json(users.map(pickUserSafeFields));
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRoles('admin'), async (req, res, next) => {
  try {
    const data = req.body || {};
    const firstName = assertValidPersonName(data.firstName, 'Имя');
    const lastName = assertValidPersonName(data.lastName, 'Фамилия');
    const middleName = assertValidPersonName(data.middleName, 'Отчество', false);
    const passwordHash = await bcrypt.hash(String(data.password || 'demo123'), 10);
    const created = await prisma.user.create({
      data: {
        id: data.id || `u${Date.now()}`,
        email: String(data.email || '').trim().toLowerCase(),
        passwordHash,
        role: data.role || 'student',
        lastName,
        firstName,
        middleName: middleName || null,
        facultyId: data.facultyId || null,
        group: data.group || null,
        recordBookNumber: data.recordBookNumber || null,
        studentCardNumber: data.studentCardNumber || null,
        permissions: data.permissions || null,
      },
    });
    res.status(201).json(pickUserSafeFields(created));
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', requireRoles('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body || {};

    const updateData = {
      role: data.role,
      lastName:
        data.lastName == null ? undefined : assertValidPersonName(data.lastName, 'Фамилия'),
      firstName: data.firstName == null ? undefined : assertValidPersonName(data.firstName, 'Имя'),
      middleName:
        data.middleName == null
          ? undefined
          : assertValidPersonName(data.middleName, 'Отчество', false),
      facultyId: data.facultyId,
      group: data.group,
      recordBookNumber: data.recordBookNumber,
      studentCardNumber: data.studentCardNumber,
      permissions: data.permissions,
    };

    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(String(data.password), 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
    });
    res.json(pickUserSafeFields(updated));
  } catch (error) {
    next(error);
  }
});

router.patch('/me/profile', async (req, res, next) => {
  try {
    const userId = req.auth.id;
    const body = req.body || {};

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName:
          body.firstName == null ? undefined : assertValidPersonName(body.firstName, 'Имя'),
        lastName:
          body.lastName == null ? undefined : assertValidPersonName(body.lastName, 'Фамилия'),
        middleName:
          body.middleName == null
            ? undefined
            : assertValidPersonName(body.middleName, 'Отчество', false),
        facultyId: body.facultyId ?? undefined,
        group: body.group ?? undefined,
        recordBookNumber: body.recordBookNumber ?? undefined,
        studentCardNumber: body.studentCardNumber ?? undefined,
      },
    });

    res.json(pickUserSafeFields(updated));
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireRoles('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id === req.auth.id) throw createHttpError(400, 'Нельзя удалить самого себя');
    await prisma.user.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
