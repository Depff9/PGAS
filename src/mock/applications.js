import { calculateApplicationScore } from './scoring';

export const APPLICATION_STATUSES = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  REVIEW: 'review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const STATUS_LABELS = {
  [APPLICATION_STATUSES.DRAFT]: 'Черновик',
  [APPLICATION_STATUSES.SUBMITTED]: 'Подано',
  [APPLICATION_STATUSES.REVIEW]: 'На рассмотрении',
  [APPLICATION_STATUSES.APPROVED]: 'Одобрено',
  [APPLICATION_STATUSES.REJECTED]: 'Отклонено',
};

const rawApplications = [
  {
    id: 'app3',
    userId: 'u5',
    directionId: 'd1',
    title: 'Диплом с отличием промежуточной аттестации',
    description:
      'Итоги зимней сессии — только «отлично» по профильным дисциплинам энергетического направления.',
    attachments: [],
    achievementLevel: 'faculty',
    status: APPLICATION_STATUSES.APPROVED,
    createdAt: '2025-09-10T08:00:00.000Z',
    updatedAt: '2025-09-12T11:00:00.000Z',
  },
  {
    id: 'app4',
    userId: 'u2',
    directionId: 'd4',
    title: 'Организация дня первокурсника',
    description:
      'Кураторство и координация культурно-творческой программы для студентов первого курса экономического факультета.',
    attachments: [],
    achievementLevel: 'faculty',
    status: APPLICATION_STATUSES.SUBMITTED,
    createdAt: '2025-10-15T12:00:00.000Z',
    updatedAt: '2025-10-15T12:00:00.000Z',
  },
];

export function withScores(applications, directions) {
  return applications.map((app) => {
    const direction = directions.find((d) => d.id === app.directionId);
    const score =
      app.score ??
      calculateApplicationScore(
        { achievementLevel: app.achievementLevel, description: app.description },
        direction
      );
    return { ...app, score };
  });
}

export const initialApplications = rawApplications;
