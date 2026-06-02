export const MAX_ACHIEVEMENTS_PER_DIRECTION = 7;

export const ACHIEVEMENT_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  REVISION: 'revision',
};

export const ACHIEVEMENT_STATUS_LABELS = {
  [ACHIEVEMENT_STATUS.DRAFT]: 'Черновик',
  [ACHIEVEMENT_STATUS.SUBMITTED]: 'На проверке',
  [ACHIEVEMENT_STATUS.APPROVED]: 'Одобрено',
  [ACHIEVEMENT_STATUS.REJECTED]: 'Отклонено',
  [ACHIEVEMENT_STATUS.REVISION]: 'Нужны правки',
};

export const ACHIEVEMENT_FIELDS = [
  { id: 'title', label: 'Название' },
  { id: 'description', label: 'Описание' },
  { id: 'attachments', label: 'Вложения (файлы)' },
  { id: 'achievementLevel', label: 'Уровень мероприятия' },
];
