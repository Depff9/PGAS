export function calculateAchievementScore(achievement, direction, matrix) {
  const level = matrix.levels.find((l) => l.id === achievement.achievementLevel);
  let score = level?.points ?? 10;
  const len = (achievement.description || '').trim().length;

  for (const bonus of [...matrix.descriptionBonuses].sort(
    (a, b) => b.minLength - a.minLength
  )) {
    if (len >= bonus.minLength) {
      score += bonus.points;
      break;
    }
  }

  const max = direction?.maxScore ?? 100;
  return Math.min(Math.round(score), max);
}

export function getEffectiveScore(achievement) {
  if (achievement.finalScore != null && achievement.finalScore !== '') {
    return Number(achievement.finalScore);
  }
  return Number(achievement.score) || 0;
}
