import { createHttpError } from './http.js';

const NAME_PATTERN = /^[А-ЯЁа-яё]+(?:[-\s][А-ЯЁа-яё]+)*$/;

export function assertValidPersonName(value, fieldLabel, required = true) {
  const normalized = String(value || '').trim();
  if (!normalized) {
    if (required) {
      throw createHttpError(400, `${fieldLabel} обязательно`);
    }
    return null;
  }
  if (!NAME_PATTERN.test(normalized)) {
    throw createHttpError(
      400,
      `${fieldLabel} может содержать только русские буквы, пробел и дефис`
    );
  }
  return normalized;
}
