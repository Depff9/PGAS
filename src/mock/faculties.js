/** Факультеты БрГУ (5 направлений подготовки на уровне факультетов) */
export const initialFaculties = [
  {
    id: 'f-feia',
    shortName: 'ФЭиА',
    name: 'Факультет Энергетики и Автоматики',
  },
  {
    id: 'f-gpf',
    shortName: 'ГПФ',
    name: 'Гуманитарно-Педагогический Факультет',
  },
  {
    id: 'f-ftsil',
    shortName: 'ФТСиЛК',
    name: 'Факультет Транспортных Систем и Лесного Комплекса',
  },
  {
    id: 'f-feis',
    shortName: 'ФЭиС',
    name: 'Факультет Экономики и Строительства',
  },
];

export function getFacultyLabel(faculty) {
  if (!faculty) return '—';
  return `${faculty.shortName} — ${faculty.name}`;
}

export function findFaculty(faculties, facultyId) {
  return faculties.find((f) => f.id === facultyId);
}
