import { prisma } from '../db.js';
import { config } from '../config.js';
import { createHttpError } from './http.js';
import { getActiveDeadlineIso, isDeadlineReached } from './regulationDeadline.js';

export function isDeadlineReachedFromIso(iso) {
  return isDeadlineReached(iso);
}

export async function resolveSubmissionDeadlineIso() {
  if (config.submissionDeadlineIso) {
    return config.submissionDeadlineIso;
  }
  const regulation = await prisma.regulation.findUnique({ where: { id: 1 } });
  return getActiveDeadlineIso(regulation);
}

export async function isDeadlineReachedNow() {
  const iso = await resolveSubmissionDeadlineIso();
  return isDeadlineReached(iso);
}

export async function assertDeadlineOpen() {
  if (await isDeadlineReachedNow()) {
    throw createHttpError(
      409,
      'Срок подачи заявлений завершен. Редактирование достижений заблокировано.'
    );
  }
}
