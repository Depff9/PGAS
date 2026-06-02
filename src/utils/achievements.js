import { getDirectionLimit } from './submissions';

export function getAchievementAt(achievements, submissionId, directionId, slotIndex) {
  return achievements.find(
    (a) =>
      a.submissionId === submissionId &&
      a.directionId === directionId &&
      a.slotIndex === slotIndex
  );
}

export function canAddSlot(achievements, submissionId, directionId, regulations) {
  const max = getDirectionLimit(regulations, directionId);
  const count = achievements.filter(
    (a) => a.submissionId === submissionId && a.directionId === directionId
  ).length;
  return count < max;
}

export function nextFreeSlot(achievements, submissionId, directionId, regulations) {
  const max = getDirectionLimit(regulations, directionId);
  for (let i = 0; i < max; i++) {
    if (!getAchievementAt(achievements, submissionId, directionId, i)) return i;
  }
  return null;
}

export function upsertAchievement(list, item) {
  const idx = list.findIndex((a) => a.id === item.id);
  if (idx >= 0) {
    const next = [...list];
    next[idx] = item;
    return next;
  }
  return [...list, item];
}

export function removeAchievement(list, id) {
  return list.filter((a) => a.id !== id);
}
