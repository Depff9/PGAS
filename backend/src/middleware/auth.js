import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';
import { config } from '../config.js';
import { createHttpError } from '../utils/http.js';

export async function authRequired(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return next(createHttpError(401, 'Требуется авторизация'));

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return next(createHttpError(401, 'Пользователь не найден'));

    req.auth = {
      id: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions || null,
    };
    return next();
  } catch {
    return next(createHttpError(401, 'Недействительный токен'));
  }
}

export function requireRoles(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.auth) return next(createHttpError(401, 'Требуется авторизация'));
    if (!allowedRoles.includes(req.auth.role)) {
      return next(createHttpError(403, 'Недостаточно прав'));
    }
    return next();
  };
}
