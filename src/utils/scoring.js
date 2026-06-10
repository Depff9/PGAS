export function getEffectiveScore(achievement) {
  if (achievement.finalScore != null && achievement.finalScore !== '') {
    return Number(achievement.finalScore);
  }
  return Number(achievement.score) || 0;
}
