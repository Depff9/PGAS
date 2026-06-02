/** Уровни значимости достижения для автоматической оценки */
export const ACHIEVEMENT_LEVELS = [
  { id: 'faculty', label: 'Внутривузовский (факультет / вуз)', points: 15 },
  { id: 'regional', label: 'Региональный', points: 30 },
  { id: 'federal', label: 'Всероссийский', points: 50 },
  { id: 'international', label: 'Международный', points: 70 },
];

/**
 * Автоматический расчёт баллов за достижение.
 * Учитываются уровень мероприятия, полнота описания и потолок по направлению.
 */
export function calculateApplicationScore({ achievementLevel, description }, direction) {
  const level = ACHIEVEMENT_LEVELS.find((l) => l.id === achievementLevel) || ACHIEVEMENT_LEVELS[0];
  const max = direction?.maxScore ?? 100;
  let score = level.points;

  const len = (description || '').trim().length;
  if (len >= 150) score += 3;
  if (len >= 300) score += 5;
  if (len >= 500) score += 7;

  return Math.min(Math.round(score), max);
}

export function getLevelLabel(levelId) {
  return ACHIEVEMENT_LEVELS.find((l) => l.id === levelId)?.label ?? levelId;
}
