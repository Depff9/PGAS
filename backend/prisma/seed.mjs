import bcrypt from 'bcryptjs';
import { PrismaClient, Role, SubmissionStatus, AchievementStatus } from '@prisma/client';

const prisma = new PrismaClient();
const DEMO_PASSWORD = 'demo123';

const faculties = [
  { id: 'f-feia', shortName: 'ФЭиА', name: 'Факультет Энергетики и Автоматики' },
  { id: 'f-gpf', shortName: 'ГПФ', name: 'Гуманитарно-Педагогический Факультет' },
  { id: 'f-ftsil', shortName: 'ФТСиЛК', name: 'Факультет Транспортных Систем и Лесного Комплекса' },
  { id: 'f-feis', shortName: 'ФЭиС', name: 'Факультет Экономики и Строительства' },
  { id: 'f-fmp', shortName: 'ФМП', name: 'Факультет Магистерской Подготовки' },
];

const groups = [
  { id: 'g1', name: 'ТТС-21', facultyId: 'f-ftsil' },
  { id: 'g2', name: 'ПГС-22', facultyId: 'f-feis' },
  { id: 'g12', name: 'ЭЭ-22', facultyId: 'f-feia' },
  { id: 'g67', name: 'ПО-24', facultyId: 'f-gpf' },
];

const directions = [
  { id: 'd1', title: 'Учебная деятельность', shortTitle: 'Учёба', description: 'Достижения в учебной деятельности', icon: 'book', active: true },
  { id: 'd2', title: 'Научно-исследовательская деятельность', shortTitle: 'НИР', description: 'Участие в НИР, конференциях, грантах', icon: 'science', active: true },
  { id: 'd3', title: 'Общественная деятельность', shortTitle: 'Общественная', description: 'Волонтёрство и самоуправление', icon: 'people', active: true },
  { id: 'd4', title: 'Культурно-творческая деятельность', shortTitle: 'Культура', description: 'Творческие мероприятия', icon: 'palette', active: true },
  { id: 'd5', title: 'Спортивные достижения', shortTitle: 'Спорт', description: 'Соревнования и призовые места', icon: 'sport', active: true },
];

const users = [
  {
    id: 'u1',
    email: 'ivanov@student.brgu.ru',
    role: Role.student,
    lastName: 'Иванов',
    firstName: 'Алексей',
    middleName: 'Сергеевич',
    facultyId: 'f-feia',
    group: 'ЭЭ-22',
    recordBookNumber: '2021001234',
    studentCardNumber: 'СБ-001234',
    permissions: null,
  },
  {
    id: 'u2',
    email: 'petrova@student.brgu.ru',
    role: Role.student,
    lastName: 'Петрова',
    firstName: 'Мария',
    middleName: 'Андреевна',
    facultyId: 'f-feis',
    group: 'ЭК-22',
    recordBookNumber: '2022005678',
    studentCardNumber: 'СБ-005678',
    permissions: null,
  },
  {
    id: 'u3',
    email: 'commission@brgu.ru',
    role: Role.commission,
    lastName: 'Смирнова',
    firstName: 'Елена',
    middleName: 'Викторовна',
    facultyId: null,
    group: null,
    recordBookNumber: null,
    studentCardNumber: null,
    permissions: {
      canEditRegulations: true,
      canEditDirections: true,
      canEditScoringMatrix: true,
      allowedDirectionIds: ['d1', 'd2', 'd3', 'd4', 'd5'],
    },
  },
  {
    id: 'u4',
    email: 'admin@brgu.ru',
    role: Role.admin,
    lastName: 'Козлов',
    firstName: 'Дмитрий',
    middleName: 'Игоревич',
    facultyId: null,
    group: null,
    recordBookNumber: null,
    studentCardNumber: null,
    permissions: null,
  },
];

const submissions = [
  {
    id: 'sub-u1',
    userId: 'u1',
    academicYear: '2025–2026',
    status: SubmissionStatus.submitted,
    submittedAt: new Date('2025-10-02T09:00:00.000Z'),
    createdAt: new Date('2025-09-15T10:00:00.000Z'),
    updatedAt: new Date('2025-10-02T09:00:00.000Z'),
  },
  {
    id: 'sub-u2',
    userId: 'u2',
    academicYear: '2025–2026',
    status: SubmissionStatus.revision,
    submittedAt: new Date('2025-10-15T12:00:00.000Z'),
    createdAt: new Date('2025-10-15T12:00:00.000Z'),
    updatedAt: new Date('2025-10-16T10:00:00.000Z'),
  },
];

const achievements = [
  {
    id: 'ach1',
    submissionId: 'sub-u1',
    userId: 'u1',
    directionId: 'd1',
    slotIndex: 0,
    title: 'Отличная успеваемость за 2024–2025 уч. год',
    description: 'Средний балл 4.9, все сессии сданы на отлично.',
    attachments: [],
    achievementLevel: 'faculty',
    status: AchievementStatus.approved,
    score: 18,
    finalScore: 18,
    revision: null,
    createdAt: new Date('2025-09-15T10:00:00.000Z'),
    updatedAt: new Date('2025-09-20T09:00:00.000Z'),
  },
  {
    id: 'ach2',
    submissionId: 'sub-u2',
    userId: 'u2',
    directionId: 'd4',
    slotIndex: 0,
    title: 'Организация дня первокурсника',
    description: 'Координация культурно-творческой программы для первокурсников.',
    attachments: [],
    achievementLevel: 'faculty',
    status: AchievementStatus.revision,
    score: 18,
    finalScore: null,
    revision: {
      items: [{ field: 'attachments', message: 'Приложите фотоотчёт или скан приказа/справки.' }],
      generalComment: '',
      templateIds: ['t2'],
      requestedAt: '2025-10-16T10:00:00.000Z',
      requestedBy: 'u3',
    },
    createdAt: new Date('2025-10-15T12:00:00.000Z'),
    updatedAt: new Date('2025-10-16T10:00:00.000Z'),
  },
];

const tooltips = [
  {
    id: 't1',
    fieldKey: 'application.title',
    label: 'Название достижения',
    text: 'Кратко сформулируйте достижение как в документе.',
  },
  {
    id: 't2',
    fieldKey: 'application.description',
    label: 'Описание',
    text: 'Опишите контекст, вашу роль, даты и результат.',
  },
];

const notifications = [
  {
    id: 'n1',
    userId: 'u1',
    type: 'approved',
    achievementId: 'ach1',
    title: 'Достижение одобрено',
    body: 'Начислено 18 баллов.',
    read: true,
    createdAt: new Date('2025-09-20T09:05:00.000Z'),
    link: '/application/workspace',
  },
];

async function seed() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

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

  await prisma.faculty.createMany({ data: faculties });
  await prisma.group.createMany({ data: groups });
  await prisma.direction.createMany({ data: directions });

  await prisma.user.createMany({
    data: users.map((u) => ({ ...u, passwordHash })),
  });

  await prisma.submission.createMany({ data: submissions });
  await prisma.achievement.createMany({ data: achievements });
  await prisma.tooltip.createMany({ data: tooltips });
  await prisma.notification.createMany({ data: notifications });

  await prisma.regulation.create({
    data: {
      id: 1,
      title: 'Регламент назначения и выплаты повышенной государственной академической стипендии (ПГАС) — БрГУ',
      updatedAt: new Date('2026-02-01T00:00:00.000Z'),
      updatedBy: 'u3',
      defaultMaxPerDirection: 7,
      directionLimits: { d1: 7, d2: 7, d3: 7, d4: 7, d5: 7 },
      sections: [
        { id: 'r1', heading: 'Общие положения', content: 'Регламент определяет порядок назначения ПГАС.' },
        { id: 'r2', heading: 'Сроки подачи', content: 'По итогам зимней сессии — до 10 февраля.' },
      ],
    },
  });

  await prisma.scoringMatrix.create({
    data: {
      id: 1,
      updatedAt: new Date(),
      levels: [
        { id: 'faculty', label: 'Внутривузовский', points: 15 },
        { id: 'regional', label: 'Региональный', points: 30 },
        { id: 'federal', label: 'Всероссийский', points: 50 },
        { id: 'international', label: 'Международный', points: 70 },
      ],
      descriptionBonuses: [],
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
