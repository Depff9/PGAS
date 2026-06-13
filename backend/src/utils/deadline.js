import { config } from '../config.js';
import { createHttpError } from './http.js';

export function isDeadlineReached() {
  if (!config.submissionDeadlineIso) return false;
  const ts = new Date(config.submissionDeadlineIso).getTime();
  if (!Number.isFinite(ts)) return false;
  return Date.now() > ts;
}

export function assertDeadlineOpen() {
  if (isDeadlineReached()) {
    throw createHttpError(
      409,
      'Срок подачи заявлений завершен. Редактирование достижений заблокировано.'
    );
  }
}
