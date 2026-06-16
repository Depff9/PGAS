import { prisma } from '../db.js';

export const SUBMISSION_PERIODS = {
  WINTER: 'winter',
  SUMMER: 'summer',
};

export function getCurrentSubmissionPeriod(regulation, referenceDate = new Date()) {
  const configured = regulation?.submissionDeadlines?.activePeriod;
  if (configured === 'winter' || configured === 'summer') return configured;
  return getCalendarSubmissionPeriod(referenceDate);
}

export function getCalendarSubmissionPeriod(referenceDate = new Date()) {
  const month = referenceDate.getMonth();
  return month >= 5 && month <= 7 ? SUBMISSION_PERIODS.SUMMER : SUBMISSION_PERIODS.WINTER;
}

export function normalizeSubmissionPeriod(value) {
  return value === SUBMISSION_PERIODS.WINTER ? SUBMISSION_PERIODS.WINTER : SUBMISSION_PERIODS.SUMMER;
}

export async function resolveCurrentSubmissionPeriod(referenceDate = new Date()) {
  const regulation = await prisma.regulation.findUnique({ where: { id: 1 } });
  return getCurrentSubmissionPeriod(regulation, referenceDate);
}
