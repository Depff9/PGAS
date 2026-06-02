const PREFIX = 'pgas_';

export function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function saveJson(key, value) {
  localStorage.setItem(PREFIX + key, JSON.stringify(value));
}

export const STORAGE_KEYS = {
  DATA_VERSION: 'dataVersion',
  USERS: 'users',
  ACHIEVEMENTS: 'achievements',
  SUBMISSIONS: 'submissions',
  APPLICATIONS: 'applications',
  DIRECTIONS: 'directions',
  REGULATIONS: 'regulations',
  FACULTIES: 'faculties',
  GROUPS: 'groups',
  TOOLTIPS: 'tooltips',
  NOTIFICATIONS: 'notifications',
  SCORING_MATRIX: 'scoringMatrix',
  HISTORY: 'history',
  SESSION: 'session',
};

export function initStorage(seedMap) {
  Object.entries(seedMap).forEach(([key, { seed }]) => {
    if (!localStorage.getItem(PREFIX + key)) {
      saveJson(key, seed);
    }
  });
}
