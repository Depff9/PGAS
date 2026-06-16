import { prisma } from '../db.js';
import { isDeadlineReached } from './regulationDeadline.js';
import { getActiveDeadlineIso } from '../../../src/utils/submissionDeadlines.js';
import { MIN_TOTAL_SCORE } from './achievementValidation.js';

const TERMINAL_ACHIEVEMENT_STATUSES = new Set(['approved', 'rejected']);

function sumApprovedScore(achievements) {
  return achievements
    .filter((item) => item.title?.trim() && item.status === 'approved')
    .reduce((sum, item) => sum + Number(item.finalScore ?? item.score ?? 0), 0);
}

function isReviewComplete(achievements) {
  const filled = achievements.filter((item) => String(item.title || '').trim());
  if (filled.length === 0) return false;
  return filled.every((item) => TERMINAL_ACHIEVEMENT_STATUSES.has(item.status));
}

/**
 * После дедлайна периода: если все достижения рассмотрены и сумма одобренных баллов < 25,
 * заявление отклоняется и исключается из рейтинга.
 */
export async function enforceMinimumScoreForSubmission(submission, achievements, regulation) {
  if (!submission || !regulation) return submission;

  const period = submission.period || 'summer';
  const deadlineIso = getActiveDeadlineIso(
    {
      submissionDeadlines: regulation.submissionDeadlines,
      sections: regulation.sections,
    },
    period
  );

  if (!isDeadlineReached(deadlineIso)) return submission;
  if (!['submitted', 'revision', 'approved'].includes(submission.status)) return submission;

  const related = achievements.filter((item) => item.submissionId === submission.id);
  if (!isReviewComplete(related)) return submission;

  const total = sumApprovedScore(related);
  if (total >= MIN_TOTAL_SCORE) return submission;

  const updated = await prisma.submission.update({
    where: { id: submission.id },
    data: {
      status: 'rejected',
      updatedAt: new Date(),
    },
  });

  return updated;
}

export async function enforceMinimumScoreRules() {
  const regulation = await prisma.regulation.findUnique({ where: { id: 1 } });
  if (!regulation) return;

  const submissions = await prisma.submission.findMany({
    where: { status: { in: ['submitted', 'revision', 'approved'] } },
  });
  if (submissions.length === 0) return;

  const achievements = await prisma.achievement.findMany({
    where: { submissionId: { in: submissions.map((item) => item.id) } },
  });

  for (const submission of submissions) {
    await enforceMinimumScoreForSubmission(
      submission,
      achievements,
      regulation
    );
  }
}

export function isSubmissionEligibleForRating(submission, achievements) {
  if (!submission || submission.status === 'draft' || submission.status === 'rejected') {
    return false;
  }
  const related = achievements.filter((item) => item.submissionId === submission.id);
  if (!isReviewComplete(related)) {
    return submission.status !== 'draft' && submission.status !== 'rejected';
  }
  return sumApprovedScore(related) >= MIN_TOTAL_SCORE;
}
