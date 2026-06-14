import { prisma } from '../db.js';
import { config } from '../config.js';
import { createHttpError } from './http.js';
import { parseDeadlineIsoFromRegulation } from './regulationDeadline.js';

function isPastDeadlineIso(iso) {
  if (!iso) return false;
  const ts = new Date(iso).getTime();
  if (!Number.isFinite(ts)) return false;
  return Date.now() > ts;
}

export function isDeadlineReachedFromIso(iso) {
  return isPastDeadlineIso(iso);
}

export async function resolveSubmissionDeadlineIso() {
  if (config.submissionDeadlineIso) {
    return config.submissionDeadlineIso;
  }
  const regulation = await prisma.regulation.findUnique({ where: { id: 1 } });
  return parseDeadlineIsoFromRegulation(regulation);
}

export async function isDeadlineReached() {
  const iso = await resolveSubmissionDeadlineIso();
  return isPastDeadlineIso(iso);
}

export async function assertDeadlineOpen() {
  if (await isDeadlineReached()) {
    throw createHttpError(
      409,
      'Срок подачи заявлений завершен. Редактирование достижений заблокировано.'
    );
  }
}
