import { ACHIEVEMENT_STATUS } from '../constants/achievements';
import { SUBMISSION_STATUS } from '../constants/submissions';
import { getCurrentAcademicYear, isSameAcademicYear } from './academicYear';
import { getCurrentSubmissionPeriod, normalizeSubmissionPeriod } from './submissionPeriod';
import { getEffectiveScore } from './scoring';
import {
  normalizeSubmissionDeadlines,
  isDeadlineReached,
} from './submissionDeadlines';

export function getDirectionLimit(regulations, directionId) {
  const limits = regulations?.directionLimits || {};
  return limits[directionId] ?? regulations?.defaultMaxPerDirection ?? 7;
}

export function getSubmissionAchievements(achievements, submissionId) {
  return achievements.filter((a) => a.submissionId === submissionId);
}

export function getStudentSubmission(
  submissions,
  userId,
  year = getCurrentAcademicYear(),
  period = null,
  regulations = null
) {
  const activePeriod = period ?? getCurrentSubmissionPeriod(regulations);
  return submissions.find(
    (s) =>
      s.userId === userId &&
      isSameAcademicYear(s.academicYear, year) &&
      (s.period || 'summer') === activePeriod
  );
}

export function isHistoricalSubmission(submission, regulations, referenceDate = new Date()) {
  if (!submission) return false;

  const now = referenceDate.getTime();
  if (!isSameAcademicYear(submission.academicYear, getCurrentAcademicYear(referenceDate))) {
    return true;
  }

  const deadlines = normalizeSubmissionDeadlines(regulations);
  const subPeriod = normalizeSubmissionPeriod(submission.period);
  const endsAt = deadlines[subPeriod]?.endsAt;
  return isDeadlineReached(endsAt, now);
}

export function isCurrentPeriodSubmission(submission, regulations, referenceDate = new Date()) {
  if (!submission || isHistoricalSubmission(submission, regulations, referenceDate)) {
    return false;
  }

  const deadlines = normalizeSubmissionDeadlines(regulations);
  return normalizeSubmissionPeriod(submission.period) === deadlines.activePeriod;
}

export function getOrCreateSubmission(
  submissions,
  userId,
  year = getCurrentAcademicYear(),
  regulations = null
) {
  const period = getCurrentSubmissionPeriod(regulations);
  const existing = getStudentSubmission(submissions, userId, year, period, regulations);
  if (existing) return existing;
  return {
    id: null,
    userId,
    academicYear: year,
    period,
    status: SUBMISSION_STATUS.DRAFT,
    submittedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function deriveSubmissionStatus(achievementList) {
  const list = achievementList.filter((a) => a.title?.trim());
  if (list.length === 0) return SUBMISSION_STATUS.DRAFT;

  if (list.every((a) => a.status === ACHIEVEMENT_STATUS.DRAFT)) {
    return SUBMISSION_STATUS.DRAFT;
  }
  if (list.some((a) => a.status === ACHIEVEMENT_STATUS.REVISION)) {
    return SUBMISSION_STATUS.REVISION;
  }
  if (list.every((a) => a.status === ACHIEVEMENT_STATUS.APPROVED)) {
    return SUBMISSION_STATUS.APPROVED;
  }
  if (
    list.length > 0 &&
    list.every(
      (a) =>
        a.status === ACHIEVEMENT_STATUS.REJECTED || a.status === ACHIEVEMENT_STATUS.DRAFT
    ) &&
    list.some((a) => a.status === ACHIEVEMENT_STATUS.REJECTED)
  ) {
    return SUBMISSION_STATUS.REJECTED;
  }
  if (list.some((a) => a.status === ACHIEVEMENT_STATUS.SUBMITTED)) {
    return SUBMISSION_STATUS.SUBMITTED;
  }
  return SUBMISSION_STATUS.SUBMITTED;
}

export function getSubmissionTotalScore(achievementList) {
  return achievementList
    .filter((a) => a.title && a.status === ACHIEVEMENT_STATUS.APPROVED)
    .reduce((sum, a) => sum + getEffectiveScore(a), 0);
}

export function countFilledAchievements(achievementList) {
  return achievementList.filter((a) => a.title?.trim()).length;
}

export function syncSubmissionFromAchievements(submission, achievements) {
  const list = getSubmissionAchievements(achievements, submission.id);
  return {
    ...submission,
    status: deriveSubmissionStatus(list),
    updatedAt: new Date().toISOString(),
  };
}

export function isSubmissionLocked(submission) {
  if (!submission) return false;
  return submission.status !== SUBMISSION_STATUS.DRAFT && submission.status !== SUBMISSION_STATUS.REVISION;
}
