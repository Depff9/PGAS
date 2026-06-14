import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET || 'change-me-in-production';

if (isProduction && (!process.env.JWT_SECRET || jwtSecret === 'change-me-in-production')) {
  throw new Error(
    'JWT_SECRET must be set to a strong random value in production (see backend/.env.example).'
  );
}

export const config = {
  port: Number(process.env.PORT || 4000),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  submissionDeadlineIso: process.env.SUBMISSION_DEADLINE_ISO || '',
  isProduction,
};
