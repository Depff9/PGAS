import { createHttpError } from '../utils/http.js';

export function requireCommissionPermission(permissionKey) {
  return (req, _res, next) => {
    if (req.auth?.role !== 'commission') {
      return next(createHttpError(403, 'Недостаточно прав'));
    }
    if (!req.auth.permissions?.[permissionKey]) {
      return next(createHttpError(403, 'У вашей учётной записи комиссии нет этого права'));
    }
    return next();
  };
}

export function assertCommissionDirectionAccess(auth, directionId) {
  if (auth.role !== 'commission') {
    throw createHttpError(403, 'Недостаточно прав');
  }
  const allowed = auth.permissions?.allowedDirectionIds;
  if (!Array.isArray(allowed) || allowed.length === 0) return;
  if (!allowed.includes(directionId)) {
    throw createHttpError(403, 'Это направление недоступно для вашей учётной записи');
  }
}

export function requireAnyCommissionPermission(...permissionKeys) {
  return (req, _res, next) => {
    if (req.auth?.role !== 'commission') {
      return next(createHttpError(403, 'Недостаточно прав'));
    }
    const allowed = permissionKeys.some((key) => req.auth.permissions?.[key]);
    if (!allowed) {
      return next(createHttpError(403, 'У вашей учётной записи комиссии нет этого права'));
    }
    return next();
  };
}
