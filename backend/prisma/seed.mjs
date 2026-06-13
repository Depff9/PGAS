import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { initialUsers, DEMO_PASSWORD } from '../../src/mock/users.js';
import { initialDirections } from '../../src/mock/directions.js';
import { initialRegulations } from '../../src/mock/regulations.js';
import { initialFaculties } from '../../src/mock/faculties.js';
import { initialGroups } from '../../src/mock/groups.js';
import { initialTooltips } from '../../src/mock/tooltips.js';
import { defaultScoringMatrix } from '../../src/mock/scoringMatrix.js';
import { initialSubmissions } from '../../src/mock/submissions.js';
import { initialAchievements } from '../../src/mock/achievements.js';

const prisma = new PrismaClient();

async function seed() {
  const passwordHashes = new Map();
  for (const u of initialUsers) {
    if (!passwordHashes.has(u.password || DEMO_PASSWORD)) {
      passwordHashes.set(
        u.password || DEMO_PASSWORD,
        await bcrypt.hash(u.password || DEMO_PASSWORD, 10)
      );
    }
  }

  await prisma.notification.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.group.deleteMany();
  await prisma.faculty.deleteMany();
  await prisma.direction.deleteMany();
  await prisma.tooltip.deleteMany();
  await prisma.historyEntry.deleteMany();
  await prisma.regulation.deleteMany();
  await prisma.scoringMatrix.deleteMany();

  await prisma.faculty.createMany({ data: initialFaculties });
  await prisma.group.createMany({ data: initialGroups });
  await prisma.direction.createMany({ data: initialDirections });

  await prisma.user.createMany({
    data: initialUsers.map((u) => ({
      id: u.id,
      email: u.email,
      passwordHash: passwordHashes.get(u.password || DEMO_PASSWORD),
      role: u.role,
      lastName: u.lastName,
      firstName: u.firstName,
      middleName: u.middleName || null,
      facultyId: u.facultyId || null,
      group: u.group || null,
      recordBookNumber: u.recordBookNumber || null,
      studentCardNumber: u.studentCardNumber || null,
      permissions: u.permissions || null,
    })),
  });

  await prisma.tooltip.createMany({ data: initialTooltips });

  await prisma.submission.createMany({
    data: initialSubmissions
      .map((s) => ({
        id: s.id,
        userId: s.userId,
        academicYear: s.academicYear,
        status: s.status,
        submittedAt: s.submittedAt ? new Date(s.submittedAt) : null,
        createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
        updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date(),
      })),
  });

  await prisma.achievement.createMany({
    data: initialAchievements
      .map((a) => ({
        id: a.id,
        submissionId: a.submissionId,
        userId: a.userId,
        directionId: a.directionId,
        slotIndex: a.slotIndex ?? 0,
        title: a.title || '',
        description: a.description || '',
        attachments: a.attachments || [],
        achievementLevel: a.achievementLevel || null,
        status: a.status || 'draft',
        score: a.score ?? null,
        finalScore: a.finalScore ?? null,
        revision: a.revision || null,
        createdAt: a.createdAt ? new Date(a.createdAt) : new Date(),
        updatedAt: a.updatedAt ? new Date(a.updatedAt) : new Date(),
      })),
  });

  await prisma.regulation.create({
    data: {
      id: 1,
      title: initialRegulations.title,
      updatedAt: new Date(initialRegulations.updatedAt || Date.now()),
      updatedBy: initialRegulations.updatedBy || null,
      defaultMaxPerDirection: initialRegulations.defaultMaxPerDirection ?? 7,
      directionLimits: initialRegulations.directionLimits || {},
      sections: initialRegulations.sections || [],
    },
  });

  await prisma.scoringMatrix.create({
    data: {
      id: 1,
      updatedAt: new Date(defaultScoringMatrix.updatedAt || Date.now()),
      levels: defaultScoringMatrix.levels || [],
      descriptionBonuses: defaultScoringMatrix.descriptionBonuses || [],
    },
  });
}

seed()
  .then(async () => {
    await prisma.$disconnect();
    // eslint-disable-next-line no-console
    console.log('Seed completed');
  })
  .catch(async (error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
