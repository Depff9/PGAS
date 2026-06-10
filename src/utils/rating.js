import { ROLES } from '../mock/users';
import { ACHIEVEMENT_STATUS } from '../constants/achievements';
import { findFaculty, getFacultyLabel } from '../mock/faculties';
import { formatFullName } from '../mock/users';
import { getEffectiveScore } from './scoring';

const COUNTED_STATUSES = [
  ACHIEVEMENT_STATUS.SUBMITTED,
  ACHIEVEMENT_STATUS.APPROVED,
  ACHIEVEMENT_STATUS.REVISION,
];

export function getStudentTotalScore(userId, achievements) {
  return achievements
    .filter((a) => a.userId === userId && COUNTED_STATUSES.includes(a.status))
    .reduce((sum, a) => sum + getEffectiveScore(a), 0);
}

export function buildFacultyRating(facultyId, users, achievements, faculties) {
  const faculty = findFaculty(faculties, facultyId);
  const students = users.filter(
    (u) => u.role === ROLES.STUDENT && u.facultyId === facultyId
  );

  const rows = students
    .map((student) => ({
      student,
      totalScore: getStudentTotalScore(student.id, achievements),
      achievementsCount: achievements.filter(
        (a) => a.userId === student.id && COUNTED_STATUSES.includes(a.status)
      ).length,
    }))
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

export function buildOverallRating(users, achievements, faculties) {
  return users
    .filter((u) => u.role === ROLES.STUDENT)
    .map((student) => {
      const faculty = findFaculty(faculties, student.facultyId);
      return {
        student,
        fullName: formatFullName(student),
        facultyLabel: faculty ? getFacultyLabel(faculty) : '—',
        totalScore: getStudentTotalScore(student.id, achievements),
        achievementsCount: achievements.filter(
          (a) => a.userId === student.id && COUNTED_STATUSES.includes(a.status)
        ).length,
      };
    })
    .filter((row) => row.achievementsCount > 0)
    .sort(
      (a, b) =>
        b.totalScore - a.totalScore ||
        a.fullName.localeCompare(b.fullName, 'ru')
    )
    .map((row, index) => ({ ...row, place: index + 1 }));
}
