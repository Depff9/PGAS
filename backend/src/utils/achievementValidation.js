import { createHttpError } from './http.js';

export const MIN_DESCRIPTION_LENGTH = 100;
export const MIN_TOTAL_SCORE = 25;

export function assertAchievementDescription(description, { required = true } = {}) {
  const text = String(description || '').trim();
  if (!required && !text) return text;
  if (text.length < MIN_DESCRIPTION_LENGTH) {
    throw createHttpError(
      400,
      `Описание достижения должно содержать не менее ${MIN_DESCRIPTION_LENGTH} символов`
    );
  }
  return text;
}

export function assertAchievementTitle(title) {
  const text = String(title || '').trim();
  if (!text) {
    throw createHttpError(400, 'Укажите название достижения');
  }
  return text;
}
