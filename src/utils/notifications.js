import { ACHIEVEMENT_STATUS } from '../constants/achievements';

export const NOTIFICATION_TYPES = {
  APPROVED: 'approved',
  REJECTED: 'rejected',
  REVISION: 'revision',
  DEADLINE: 'deadline',
};

/** Уведомляем только о важных событиях — не о «на рассмотрении» */
export function shouldNotifyStatus(status) {
  return [
    ACHIEVEMENT_STATUS.APPROVED,
    ACHIEVEMENT_STATUS.REJECTED,
    ACHIEVEMENT_STATUS.REVISION,
  ].includes(status);
}

export function buildStatusNotification(achievement, studentId, directionTitle) {
  const base = {
    id: 'n' + Date.now() + Math.random().toString(36).slice(2, 6),
    userId: studentId,
    achievementId: achievement.id,
    read: false,
    createdAt: new Date().toISOString(),
    link: '/application/workspace',
  };

  if (achievement.status === ACHIEVEMENT_STATUS.APPROVED) {
    return {
      ...base,
      type: NOTIFICATION_TYPES.APPROVED,
      title: 'Достижение одобрено',
      body: `«${achievement.title}» (${directionTitle}) принято. Начислено ${achievement.finalScore ?? achievement.score} баллов.`,
    };
  }
  if (achievement.status === ACHIEVEMENT_STATUS.REJECTED) {
    return {
      ...base,
      type: NOTIFICATION_TYPES.REJECTED,
      title: 'Достижение отклонено',
      body: `«${achievement.title}» (${directionTitle}) не принято комиссией.`,
    };
  }
  if (achievement.status === ACHIEVEMENT_STATUS.REVISION) {
    const items = achievement.revision?.items || [];
    const hint = items.map((i) => i.message).join(' ') || achievement.revision?.generalComment;
    return {
      ...base,
      type: NOTIFICATION_TYPES.REVISION,
      title: 'Требуются правки',
      body: `«${achievement.title}»: ${hint || 'Исправьте замечания комиссии и отправьте снова.'}`,
    };
  }
  return null;
}

export function buildDeadlineNotification(userId, message) {
  return {
    id: 'n' + Date.now(),
    userId,
    type: NOTIFICATION_TYPES.DEADLINE,
    title: 'Напоминание о сроке подачи',
    body: message,
    read: false,
    createdAt: new Date().toISOString(),
    link: '/application/workspace',
  };
}

export function appendNotification(notifications, notification) {
  if (!notification) return notifications;
  return [notification, ...notifications];
}
