export const DEFAULT_EVENT_LEVELS = [
  { id: 'faculty', label: 'Внутривузовский' },
  { id: 'regional', label: 'Региональный' },
  { id: 'federal', label: 'Всероссийский' },
  { id: 'international', label: 'Международный' },
];

export function getEventLevels(regulations) {
  const levels = regulations?.eventLevels;
  return Array.isArray(levels) && levels.length ? levels : DEFAULT_EVENT_LEVELS;
}

export function getEventLevelLabel(regulations, levelId) {
  if (!levelId) return '—';
  const level = getEventLevels(regulations).find((item) => item.id === levelId);
  return level?.label || levelId;
}
