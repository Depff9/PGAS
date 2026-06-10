/** Уровни значимости достижения для автоматической оценки */
export const ACHIEVEMENT_LEVELS = [
  { id: 'faculty', label: 'Внутривузовский', points: 15 },
  { id: 'regional', label: 'Региональный', points: 30 },
  { id: 'federal', label: 'Всероссийский', points: 50 },
  { id: 'international', label: 'Международный', points: 70 },
];

/**
 * Автоматический расчёт баллов за достижение.
 * Учитывается только уровень мероприятия.
 */
export function calculateApplicationScore({ achievementLevel }) {
  const level = ACHIEVEMENT_LEVELS.find((l) => l.id === achievementLevel) || ACHIEVEMENT_LEVELS[0];
  return Math.round(level.points);
}

export function getLevelLabel(levelId) {
  return ACHIEVEMENT_LEVELS.find((l) => l.id === levelId)?.label ?? levelId;
}
