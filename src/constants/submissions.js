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

export {
  getCurrentAcademicYear,
  getCurrentSemesterLabel,
  getPreviousAcademicYear,
  isSameAcademicYear,
} from '../utils/academicYear.js';
