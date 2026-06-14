import { getPreviousAcademicYear } from '../utils/academicYear.js';

const PREVIOUS_YEAR = getPreviousAcademicYear();

export function dateInAcademicYear(academicYearLabel, monthIndex, day, hour = 12, minute = 0) {
  const startYear = Number(academicYearLabel.split('–')[0]);
  const calendarYear = monthIndex >= 8 ? startYear : startYear + 1;
  return new Date(calendarYear, monthIndex, day, hour, minute, 0, 0).toISOString();
}

export function recentIso(daysAgo, hour = 12, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

export const ARCHIVE_YEAR = PREVIOUS_YEAR;
