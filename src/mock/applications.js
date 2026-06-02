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
    id: 'app1',
    userId: 'u1',
    directionId: 'd1',
    title: 'Отличная успеваемость за 2024–2025 уч. год',
    description:
      'Средний балл 4.9, все сессии сданы на «отлично». Подтверждено справкой деканата факультета энергетики и автоматики БрГУ.',
    attachments: [],
    achievementLevel: 'faculty',
    status: APPLICATION_STATUSES.APPROVED,
    createdAt: '2025-09-15T10:00:00.000Z',
    updatedAt: '2025-09-20T09:00:00.000Z',
  },
  {
    id: 'app2',
    userId: 'u1',
    directionId: 'd2',
    title: 'Доклад на студенческой конференции БрГУ',
    description:
      'Участие в межвузовской научной конференции с докладом по энергетике. Тезисы опубликованы в сборнике материалов конференции.',
    attachments: [],
    achievementLevel: 'regional',
    status: APPLICATION_STATUSES.REVIEW,
    createdAt: '2025-10-01T14:30:00.000Z',
    updatedAt: '2025-10-02T09:00:00.000Z',
  },
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
      'Кураторство и координация культурно-массовой программы для студентов первого курса экономического факультета.',
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
