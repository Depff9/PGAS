export const SUBMISSION_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  REVISION: 'revision',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const SUBMISSION_STATUS_LABELS = {
  [SUBMISSION_STATUS.DRAFT]: 'Черновик',
  [SUBMISSION_STATUS.SUBMITTED]: 'Подано',
  [SUBMISSION_STATUS.REVISION]: 'Требуются правки',
  [SUBMISSION_STATUS.APPROVED]: 'Одобрено',
  [SUBMISSION_STATUS.REJECTED]: 'Отклонено',
};

export const CURRENT_ACADEMIC_YEAR = '2025–2026';
