import { ROLES } from '../mock/users';
import { ACHIEVEMENT_STATUS } from '../constants/achievements';
import { findFaculty, getFacultyLabel } from '../mock/faculties';
import { formatFullName } from '../mock/users';
import { getEffectiveScore } from './scoring';
import { SUBMISSION_STATUS } from '../constants/submissions';
import { isCurrentPeriodSubmission } from './submissions';

const MIN_RATING_SCORE = 25;

function getCurrentSubmissionIds(submissions = [], regulations = null) {
  return new Set(
    submissions
      .filter((submission) => isCurrentPeriodSubmission(submission, regulations))
      .map((submission) => submission.id)
  );
}

function isCurrentPeriodAchievement(achievement, currentSubmissionIds) {
  if (currentSubmissionIds === null) return true;
  if (!achievement.submissionId) return false;
  return currentSubmissionIds.has(achievement.submissionId);
}

export function getStudentTotalScore(userId, achievements, submissions = null, regulations = null) {
  const currentSubmissionIds =
    submissions && submissions.length > 0
      ? getCurrentSubmissionIds(submissions, regulations)
      : null;
  return achievements
    .filter(
      (a) =>
        a.userId === userId &&
        a.status === ACHIEVEMENT_STATUS.APPROVED &&
        isCurrentPeriodAchievement(a, currentSubmissionIds)
    )
    .reduce((sum, a) => sum + getEffectiveScore(a), 0);
}

export function buildFacultyRating(
  facultyId,
  users,
  achievements,
  faculties,
  submissions = null,
  regulations = null
) {
  const faculty = findFaculty(faculties, facultyId);
  const currentSubmissionIds =
    submissions && submissions.length > 0
      ? getCurrentSubmissionIds(submissions, regulations)
      : null;
  const students = users.filter(
    (u) => u.role === ROLES.STUDENT && u.facultyId === facultyId
  );

  const rows = students
    .map((student) => ({
      student,
      totalScore: getStudentTotalScore(student.id, achievements, submissions, regulations),
      achievementsCount: achievements.filter(
        (a) =>
          a.userId === student.id &&
          a.status === ACHIEVEMENT_STATUS.APPROVED &&
          isCurrentPeriodAchievement(a, currentSubmissionIds)
      ).length,
    }))
    .filter((row) => row.totalScore >= MIN_RATING_SCORE)
    .sort(
      (a, b) =>
        b.totalScore - a.totalScore ||
        a.student.lastName.localeCompare(b.student.lastName, 'ru')
    );

  return {
    faculty,
    facultyLabel: faculty ? getFacultyLabel(faculty) : '—',
    rows: rows.map((row, index) => ({
      ...row,
      place: index + 1,
      fullName: formatFullName(row.student),
    })),
  };
}

export function buildOverallRating(users, achievements, faculties, submissions = [], regulations = null) {
  const studentById = new Map(
    users.filter((u) => u.role === ROLES.STUDENT).map((u) => [u.id, u])
  );
  const studentsFromSubmissions = submissions
    .map((s) => s.user)
    .filter((u) => u && u.role === ROLES.STUDENT)
    .filter((u, index, arr) => arr.findIndex((item) => item.id === u.id) === index);
  studentsFromSubmissions.forEach((student) => {
    if (!studentById.has(student.id)) {
      studentById.set(student.id, student);
    }
  });

  const currentSubmissions = submissions.filter(
    (s) =>
      isCurrentPeriodSubmission(s, regulations) &&
      s.status &&
      s.status !== SUBMISSION_STATUS.DRAFT &&
      s.status !== SUBMISSION_STATUS.REJECTED
  );
  const currentSubmissionIds =
    submissions && submissions.length > 0
      ? getCurrentSubmissionIds(submissions, regulations)
      : null;
  const submittedUserIds = new Set(currentSubmissions.map((s) => s.userId));

  return [...studentById.values()]
    .filter((u) => submittedUserIds.has(u.id))
    .map((student) => {
      const faculty = findFaculty(faculties, student.facultyId);
      return {
        student,
        fullName: formatFullName(student),
        facultyLabel: faculty ? getFacultyLabel(faculty) : '—',
        totalScore: getStudentTotalScore(student.id, achievements, submissions, regulations),
        achievementsCount: achievements.filter(
          (a) =>
            a.userId === student.id &&
            a.status === ACHIEVEMENT_STATUS.APPROVED &&
            isCurrentPeriodAchievement(a, currentSubmissionIds)
        ).length,
      };
    })
    .filter((row) => row.totalScore >= MIN_RATING_SCORE)
    .sort(
      (a, b) =>
        b.totalScore - a.totalScore ||
        a.fullName.localeCompare(b.fullName, 'ru')
    )
    .map((row, index) => ({ ...row, place: index + 1 }));
}
