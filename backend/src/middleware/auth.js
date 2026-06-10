import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { createHttpError } from '../utils/http.js';

export function authRequired(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return next(createHttpError(401, 'Требуется авторизация'));

  try {
    req.auth = jwt.verify(token, config.jwtSecret);
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
