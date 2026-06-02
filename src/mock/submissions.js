import { SUBMISSION_STATUS } from '../constants/submissions';
import { CURRENT_ACADEMIC_YEAR } from '../constants/submissions';

export const initialSubmissions = [
  {
    id: 'sub-u1',
    userId: 'u1',
    academicYear: CURRENT_ACADEMIC_YEAR,
    status: SUBMISSION_STATUS.SUBMITTED,
    submittedAt: '2025-10-02T09:00:00.000Z',
    createdAt: '2025-09-15T10:00:00.000Z',
    updatedAt: '2025-10-02T09:00:00.000Z',
  },
  {
    id: 'sub-u2',
    userId: 'u2',
    academicYear: CURRENT_ACADEMIC_YEAR,
    status: SUBMISSION_STATUS.REVISION,
    submittedAt: '2025-10-15T12:00:00.000Z',
    createdAt: '2025-10-15T12:00:00.000Z',
    updatedAt: '2025-10-16T10:00:00.000Z',
  },
  {
    id: 'sub-u5',
    userId: 'u5',
    academicYear: CURRENT_ACADEMIC_YEAR,
    status: SUBMISSION_STATUS.APPROVED,
    submittedAt: '2025-09-12T11:00:00.000Z',
    createdAt: '2025-09-10T08:00:00.000Z',
    updatedAt: '2025-09-12T11:00:00.000Z',
  },
];
