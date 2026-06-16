import { ROLES } from '../mock/users';

const FACULTY_NAME_MAP = {
  'Институт информационных технологий': 'f-feia',
  'Экономический факультет': 'f-feis',
  'Факультет Энергетики и Автоматики': 'f-feia',
  'Факультет Экономики и Строительства': 'f-feis',
};

/** Приводит старые записи localStorage к актуальной модели пользователя */
export function migrateUser(user, faculties) {
  if (!user) return user;

  let facultyId = user.facultyId ?? null;
  if (!facultyId && user.faculty) {
    facultyId =
      FACULTY_NAME_MAP[user.faculty] ??
      faculties.find((f) => f.name === user.faculty)?.id ??
      null;
  }

  let group = user.group ?? '';
  if (group && /-\d{2}-\d{2}$/.test(group)) {
    group = group.replace(/-\d{2}$/, '');
  }

  const base = {
    ...user,
    facultyId: user.role === ROLES.STUDENT ? facultyId : null,
    group: user.role === ROLES.STUDENT ? group : null,
    permissions:
      user.role === ROLES.COMMISSION
        ? {
            canEditRegulations: user.permissions?.canEditRegulations ?? false,
            canEditDirections: user.permissions?.canEditDirections ?? false,
            allowedDirectionIds: user.permissions?.allowedDirectionIds ?? [],
          }
        : null,
    recordBookNumber:
      user.role === ROLES.STUDENT
        ? user.recordBookNumber ?? user.studentId ?? ''
        : null,
    studentCardNumber:
      user.role === ROLES.STUDENT ? user.studentCardNumber ?? '' : null,
  };

  delete base.faculty;
  delete base.studentId;

  return base;
}

export function migrateUsers(users, faculties) {
  return users.map((u) => migrateUser(u, faculties));
}

export function migrateApplication(app) {
  if (app.score != null && app.achievementLevel) return app;
  return {
    ...app,
    achievementLevel: app.achievementLevel ?? 'faculty',
    score: app.score ?? 0,
    scoreNote: app.scoreNote ?? '',
  };
}
