FROM node:20-alpine AS base
WORKDIR /workspace
RUN apk add --no-cache openssl

FROM base AS deps
COPY backend/package.json backend/package-lock.json ./backend/
WORKDIR /workspace/backend
RUN npm ci --ignore-scripts

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /workspace/backend

COPY --from=deps /workspace/backend/node_modules ./node_modules
COPY backend/package.json backend/package-lock.json ./
COPY backend/prisma ./prisma
COPY backend/src ./src
COPY src/utils/submissionDeadlines.js ../src/utils/submissionDeadlines.js
COPY src/utils/academicYear.js ../src/utils/academicYear.js
COPY src/mock ../src/mock

RUN npx prisma generate

COPY docker/backend-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

WORKDIR /workspace/backend
EXPOSE 4000
ENTRYPOINT ["/entrypoint.sh"]
