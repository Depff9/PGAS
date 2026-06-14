import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';
import { config } from '../config.js';
import { createHttpError, pickUserSafeFields } from '../utils/http.js';
import { authRequired } from '../middleware/auth.js';
import { assertValidPersonName } from '../utils/personName.js';
import { recordAuditEntry } from '../utils/auditHistory.js';
import { formatFullName } from '../utils/personNameFormat.js';

const router = Router();

function assertPasswordPolicy(password) {
  if (password.length < 6) {
    throw createHttpError(400, 'Пароль должен быть не короче 6 символов');
  }
  if (password.length > 128) {
    throw createHttpError(400, 'Пароль слишком длинный');
  }
}

function signUser(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    permissions: user.permissions || null,
  };

  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!email || !password) {
      throw createHttpError(400, 'Email и пароль обязательны');
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw createHttpError(401, 'Неверный email или пароль');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw createHttpError(401, 'Неверный email или пароль');

    await recordAuditEntry({
      action: 'login',
      entity: 'auth.login',
      summary: `Вход в систему: ${user.email}`,
      createdBy: user.id,
      userName: formatFullName(user),
      metadata: { role: user.role, email: user.email },
    });

    const token = signUser(user);
    res.json({ token, user: pickUserSafeFields(user) });
  } catch (error) {
    next(error);
  }
});

router.post('/register', async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const firstName = assertValidPersonName(req.body?.firstName, 'Имя');
    const lastName = assertValidPersonName(req.body?.lastName, 'Фамилия');
    const middleName = assertValidPersonName(req.body?.middleName, 'Отчество', false);

    if (!email || !password || !firstName || !lastName) {
      throw createHttpError(400, 'Заполните обязательные поля');
    }
    assertPasswordPolicy(password);

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw createHttpError(409, 'Пользователь с таким email уже существует');

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        id: `u${Date.now()}`,
        email,
        passwordHash,
        role: 'student',
        firstName,
        lastName,
        middleName: middleName || null,
      },
    });

    await recordAuditEntry({
      action: 'register',
      entity: 'auth.register',
      summary: `Регистрация студента: ${user.email}`,
      createdBy: user.id,
      userName: formatFullName(user),
      metadata: { role: user.role, email: user.email },
    });

    const token = signUser(user);
    res.status(201).json({ token, user: pickUserSafeFields(user) });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authRequired, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.auth.id } });
    if (!user) throw createHttpError(404, 'Пользователь не найден');
    res.json({ user: pickUserSafeFields(user) });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', authRequired, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.auth.id } });
    if (user) {
      await recordAuditEntry({
        action: 'logout',
        entity: 'auth.logout',
        summary: `Выход из системы: ${user.email}`,
        createdBy: user.id,
        userName: formatFullName(user),
        metadata: { role: user.role, email: user.email },
      });
    }
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
