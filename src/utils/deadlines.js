import { buildDeadlineNotification } from './notifications';
import { NOTIFICATION_TYPES } from './notifications';
import { getActiveDeadlineLabel } from './submissionDeadlines';

export function ensureDeadlineNotifications(users, notifications, regulations) {
  if (!notifications?.length) return notifications || [];

  const students = users.filter((u) => u.role === 'student');
  const deadlineText = getActiveDeadlineLabel(regulations);
  const message = `Напоминание: приём заявлений на ПГАС завершается (${deadlineText}). Проверьте таблицу достижений.`;

  const already = notifications.some(
    (n) => n.type === NOTIFICATION_TYPES.DEADLINE && n.body?.includes('Напоминание')
  );
  if (already) return notifications;

  let next = [...notifications];
  students.forEach((s) => {
    next = [...next, buildDeadlineNotification(s.id, message)];
  });
  return next;
}
