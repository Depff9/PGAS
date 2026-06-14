import { SUBMISSION_STATUS } from '../constants/submissions.js';
import { getCurrentAcademicYear } from '../utils/academicYear.js';
import { dateInAcademicYear, recentIso, ARCHIVE_YEAR } from './demoDates.js';

const CURRENT_YEAR = getCurrentAcademicYear();

export const initialSubmissions = [
  {
    id: 'sub-u1-archived',
    userId: 'u1',
    academicYear: ARCHIVE_YEAR,
    status: SUBMISSION_STATUS.APPROVED,
    submittedAt: dateInAcademicYear(ARCHIVE_YEAR, 1, 8, 10),
    createdAt: dateInAcademicYear(ARCHIVE_YEAR, 1, 5, 8),
    updatedAt: dateInAcademicYear(ARCHIVE_YEAR, 1, 10, 12),
  },
  {
    id: 'sub-u10-archived',
    userId: 'u10',
    academicYear: ARCHIVE_YEAR,
    status: SUBMISSION_STATUS.APPROVED,
    submittedAt: dateInAcademicYear(ARCHIVE_YEAR, 5, 28, 11),
    createdAt: dateInAcademicYear(ARCHIVE_YEAR, 5, 25, 9),
    updatedAt: dateInAcademicYear(ARCHIVE_YEAR, 6, 1, 15),
  },
  {
    id: 'sub-u2',
    userId: 'u2',
    academicYear: CURRENT_YEAR,
    status: SUBMISSION_STATUS.REVISION,
    submittedAt: recentIso(3, 11, 15),
    createdAt: recentIso(3, 11, 15),
    updatedAt: recentIso(2, 9, 30),
  },
  {
    id: 'sub-u5',
    userId: 'u5',
    academicYear: CURRENT_YEAR,
    status: SUBMISSION_STATUS.APPROVED,
    submittedAt: recentIso(4, 10, 30),
    createdAt: recentIso(4, 8, 0),
    updatedAt: recentIso(4, 10, 30),
  },
  {
    id: 'sub-u6',
    userId: 'u6',
    academicYear: CURRENT_YEAR,
    status: SUBMISSION_STATUS.SUBMITTED,
    submittedAt: recentIso(2, 14, 0),
    createdAt: recentIso(2, 7, 30),
    updatedAt: recentIso(2, 14, 0),
  },
  {
    id: 'sub-u7',
    userId: 'u7',
    academicYear: CURRENT_YEAR,
    status: SUBMISSION_STATUS.APPROVED,
    submittedAt: recentIso(5, 9, 0),
    createdAt: recentIso(5, 7, 15),
    updatedAt: recentIso(5, 9, 0),
  },
  {
    id: 'sub-u8',
    userId: 'u8',
    academicYear: CURRENT_YEAR,
    status: SUBMISSION_STATUS.SUBMITTED,
    submittedAt: recentIso(1, 8, 45),
    createdAt: recentIso(1, 10, 0),
    updatedAt: recentIso(1, 8, 45),
  },
  {
    id: 'sub-u9',
    userId: 'u9',
    academicYear: CURRENT_YEAR,
    status: SUBMISSION_STATUS.APPROVED,
    submittedAt: recentIso(0, 16, 20),
    createdAt: recentIso(0, 8, 5),
    updatedAt: recentIso(0, 16, 20),
  },
  {
    id: 'sub-u10',
    userId: 'u10',
    academicYear: CURRENT_YEAR,
    status: SUBMISSION_STATUS.REVISION,
    submittedAt: recentIso(4, 9, 20),
    createdAt: recentIso(4, 9, 20),
    updatedAt: recentIso(3, 10, 15),
  },
];
