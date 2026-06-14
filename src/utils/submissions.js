import { ACHIEVEMENT_STATUS } from '../constants/achievements';
import { SUBMISSION_STATUS } from '../constants/submissions';
import { getCurrentAcademicYear, isSameAcademicYear } from './academicYear';
import { getEffectiveScore } from './scoring';

export function getDirectionLimit(regulations, directionId) {
  const limits = regulations?.directionLimits || {};
  return limits[directionId] ?? regulations?.defaultMaxPerDirection ?? 7;
}

export function getSubmissionAchievements(achievements, submissionId) {
  return achievements.filter((a) => a.submissionId === submissionId);
}

export function getStudentSubmission(submissions, userId, year = getCurrentAcademicYear()) {
  return submissions.find(
    (s) => s.userId === userId && isSameAcademicYear(s.academicYear, year)
  );
}

export function isHistoricalSubmission(submission, referenceDate = new Date()) {
  if (!submission) return false;
  return !isSameAcademicYear(submission.academicYear, getCurrentAcademicYear(referenceDate));
}

export function isCurrentPeriodSubmission(submission, referenceDate = new Date()) {
  if (!submission) return false;
  return isSameAcademicYear(submission.academicYear, getCurrentAcademicYear(referenceDate));
}

export function getOrCreateSubmission(submissions, userId, year = getCurrentAcademicYear()) {
  const existing = getStudentSubmission(submissions, userId, year);
  if (existing) return existing;
  return {
    id: 'sub-' + userId + '-' + year.replace(/\D/g, ''),
    userId,
    academicYear: year,
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
    .filter((a) => a.title && a.status !== ACHIEVEMENT_STATUS.DRAFT)
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
