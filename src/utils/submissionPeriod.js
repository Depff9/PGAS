export const SUBMISSION_PERIODS = {
  WINTER: 'winter',
  SUMMER: 'summer',
};

export const PERIOD_SHORT_LABELS = {
  winter: 'зимняя сессия',
  summer: 'летняя сессия',
};

/** Текущий конкурсный период (зимний или летний) в рамках учебного года. */
export function getCurrentSubmissionPeriod(regulations, referenceDate = new Date()) {
  const configured = regulations?.submissionDeadlines?.activePeriod;
  if (configured === 'winter' || configured === 'summer') return configured;
  const month = referenceDate.getMonth();
  return month >= 5 && month <= 7 ? SUBMISSION_PERIODS.SUMMER : SUBMISSION_PERIODS.WINTER;
}

export function normalizeSubmissionPeriod(value) {
  return value === SUBMISSION_PERIODS.WINTER ? SUBMISSION_PERIODS.WINTER : SUBMISSION_PERIODS.SUMMER;
}
