/**
 * Учебный год БрГУ: с 1 сентября по 31 августа.
 * Пример: 15.06.2026 → 2025–2026, 15.09.2026 → 2026–2027.
 */
export function getCurrentAcademicYear(referenceDate = new Date()) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const startYear = month >= 8 ? year : year - 1;
  return `${startYear}–${startYear + 1}`;
}

export function getPreviousAcademicYear(referenceDate = new Date()) {
  const startYear = Number(getCurrentAcademicYear(referenceDate).split('–')[0]);
  return `${startYear - 1}–${startYear}`;
}

export function normalizeAcademicYearKey(year) {
  return String(year || '')
    .trim()
    .replace(/[\u2013\u2014/\s]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

export function isSameAcademicYear(a, b) {
  if (!a || !b) return false;
  return normalizeAcademicYearKey(a) === normalizeAcademicYearKey(b);
}

export function getAcademicYearVariants(referenceDate = new Date()) {
  const label = getCurrentAcademicYear(referenceDate);
  const [start, end] = label.split('–').map(Number);
  return [label, `${start}-${end}`, `${start}/${end}`];
}

export function getCurrentSemesterLabel(regulations, referenceDate = new Date()) {
  const academicYear = getCurrentAcademicYear(referenceDate);
  const configuredPeriod = regulations?.submissionDeadlines?.activePeriod;
  const month = referenceDate.getMonth();
  const activePeriod =
    configuredPeriod === 'winter' || configuredPeriod === 'summer'
      ? configuredPeriod
      : month >= 5 && month <= 7
        ? 'summer'
        : 'winter';
  const semesterNum = activePeriod === 'winter' ? 1 : 2;
  return `${semesterNum} семестр ${academicYear}`;
}

export function getAcademicYearStartDate(referenceDate = new Date()) {
  const startYear = Number(getCurrentAcademicYear(referenceDate).split('–')[0]);
  return new Date(startYear, 8, 1, 0, 0, 0, 0);
}

export function getAcademicYearEndDate(referenceDate = new Date()) {
  const startYear = Number(getCurrentAcademicYear(referenceDate).split('–')[0]);
  return new Date(startYear + 1, 7, 31, 23, 59, 59, 999);
}
