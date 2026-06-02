import { NOTIFICATION_TYPES } from '../utils/notifications';

export const initialNotifications = [
  {
    id: 'n1',
    userId: 'u1',
    type: NOTIFICATION_TYPES.APPROVED,
    achievementId: 'ach1',
    title: 'Достижение одобрено',
    body: '«Отличная успеваемость…» (Учёба) принято. Начислено 18 баллов.',
    read: true,
    createdAt: '2025-09-20T09:05:00.000Z',
    link: '/application/workspace',
  },
  {
    id: 'n2',
    userId: 'u2',
    type: NOTIFICATION_TYPES.REVISION,
    achievementId: 'ach4',
    title: 'Требуются правки',
    body: '«Организация дня первокурсника»: Приложите фотоотчёт или скан приказа.',
    read: false,
    createdAt: '2025-10-16T10:05:00.000Z',
    link: '/application/workspace',
  },
];
