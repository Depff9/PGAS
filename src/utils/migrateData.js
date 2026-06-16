import { ACHIEVEMENT_STATUS } from '../constants/achievements';
import { initialAchievements } from '../mock/achievements';
import { initialSubmissions } from '../mock/submissions';
import { getCurrentAcademicYear, isSameAcademicYear } from './academicYear';
import { getOrCreateSubmission } from './submissions';

const STATUS_MAP = {
  review: ACHIEVEMENT_STATUS.SUBMITTED,
  submitted: ACHIEVEMENT_STATUS.SUBMITTED,
  approved: ACHIEVEMENT_STATUS.APPROVED,
  rejected: ACHIEVEMENT_STATUS.REJECTED,
  draft: ACHIEVEMENT_STATUS.DRAFT,
  revision: ACHIEVEMENT_STATUS.REVISION,
};

export function normalizeAchievement(raw) {
  const achievement = {
    id: raw.id,
    submissionId: raw.submissionId,
    userId: raw.userId,
    directionId: raw.directionId,
    slotIndex: raw.slotIndex ?? 0,
    title: raw.title || '',
    description: raw.description || '',
    attachments: raw.attachments || [],
    achievementLevel: raw.achievementLevel || 'faculty',
    status: STATUS_MAP[raw.status] || raw.status || ACHIEVEMENT_STATUS.DRAFT,
    revision: raw.revision || null,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
  const score = raw.score ?? 0;
  return {
    ...achievement,
    score,
    finalScore: raw.finalScore ?? (raw.status === 'approved' ? score : null),
  };
}

function buildSubmissionsFromAchievements(achievements, existingSubmissions) {
  const submissions = [...(existingSubmissions || [])];
  const userIds = [...new Set(achievements.map((a) => a.userId))];

  userIds.forEach((userId) => {
    let sub = submissions.find(
      (s) => s.userId === userId && isSameAcademicYear(s.academicYear, getCurrentAcademicYear())
    );
    if (!sub) {
      sub = getOrCreateSubmission(submissions, userId);
      submissions.push(sub);
    }
    achievements.forEach((a) => {
      if (a.userId === userId && !a.submissionId) {
        a.submissionId = sub.id;
      }
    });
  });

  return submissions;
}

export function hydrateAchievements(raw, _directions, submissionsSeed) {
  const stored = raw.achievements ?? raw.applications;
  if (!stored?.length) {
    return {
      achievements: raw.achievements ? [] : initialAchievements,
      submissions:
        submissionsSeed?.length
          ? submissionsSeed
          : raw.submissions
            ? []
            : initialSubmissions,
    };
  }

  let achievements;
  if (stored[0]?.slotIndex != null && stored[0]?.directionId) {
    achievements = stored.map((a) => normalizeAchievement(a));
  } else {
    const byUserDir = {};
    achievements = stored.map((app) => {
      const key = `${app.userId}-${app.directionId}`;
      const slotIndex = byUserDir[key] ?? 0;
      byUserDir[key] = slotIndex + 1;
      return normalizeAchievement(
        {
          ...app,
          id: app.id?.replace('app', 'ach') || 'ach' + Date.now(),
          slotIndex,
          status: STATUS_MAP[app.status] || app.status,
          finalScore: app.status === 'approved' ? app.score : null,
          revision: app.revision || null,
        }
      );
    });
  }

  const submissions = buildSubmissionsFromAchievements(
    achievements,
    submissionsSeed
  );

  achievements = achievements.map((a) => {
    if (a.submissionId) return a;
    const sub = submissions.find((s) => s.userId === a.userId);
    return { ...a, submissionId: sub?.id };
  });

  return { achievements, submissions };
}
