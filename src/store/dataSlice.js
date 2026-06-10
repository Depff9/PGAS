import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { loadJson, saveJson, STORAGE_KEYS, initStorage } from '../utils/storage';
import { initialUsers } from '../mock/users';
import { initialAchievements } from '../mock/achievements';
import { initialSubmissions } from '../mock/submissions';
import { initialDirections } from '../mock/directions';
import { initialRegulations } from '../mock/regulations';
import { initialFaculties } from '../mock/faculties';
import { initialGroups } from '../mock/groups';
import { initialTooltips } from '../mock/tooltips';
import { initialNotifications } from '../mock/notifications';
import { defaultScoringMatrix } from '../mock/scoringMatrix';
import { migrateUsers } from '../utils/migrateUser';
import { hydrateAchievements } from '../utils/migrateData';
import { fetchBootstrapData } from '../api/dataApi';
import { getToken } from '../api/client';

const DATA_VERSION = 5;

const seeds = {
  [STORAGE_KEYS.USERS]: initialUsers,
  [STORAGE_KEYS.ACHIEVEMENTS]: initialAchievements,
  [STORAGE_KEYS.SUBMISSIONS]: initialSubmissions,
  [STORAGE_KEYS.DIRECTIONS]: initialDirections,
  [STORAGE_KEYS.REGULATIONS]: initialRegulations,
  [STORAGE_KEYS.FACULTIES]: initialFaculties,
  [STORAGE_KEYS.GROUPS]: initialGroups,
  [STORAGE_KEYS.TOOLTIPS]: initialTooltips,
  [STORAGE_KEYS.NOTIFICATIONS]: initialNotifications,
  [STORAGE_KEYS.SCORING_MATRIX]: defaultScoringMatrix,
  [STORAGE_KEYS.HISTORY]: [],
};

function resetToSeeds() {
  Object.entries(seeds).forEach(([key, seed]) => saveJson(key, seed));
  saveJson(STORAGE_KEYS.DATA_VERSION, DATA_VERSION);
}

if (loadJson(STORAGE_KEYS.DATA_VERSION, 0) !== DATA_VERSION) {
  resetToSeeds();
} else {
  initStorage(
    Object.fromEntries(Object.entries(seeds).map(([k, seed]) => [k, { seed }]))
  );
}

function hydrate(raw) {
  const faculties = raw.faculties?.length ? raw.faculties : initialFaculties;
  const directions = raw.directions?.length ? raw.directions : initialDirections;
  const scoringMatrix = raw.scoringMatrix || defaultScoringMatrix;
  const users = migrateUsers(raw.users || initialUsers, faculties);

  const { achievements, submissions } = hydrateAchievements(
    {
      achievements:
        raw.achievements ??
        loadJson(STORAGE_KEYS.APPLICATIONS, null) ??
        raw.applications,
    },
    directions,
    scoringMatrix,
    raw.submissions
  );

  return {
    users,
    achievements,
    submissions,
    directions,
    regulations: raw.regulations || initialRegulations,
    faculties,
    groups: raw.groups || initialGroups,
    tooltips: raw.tooltips || initialTooltips,
    notifications: raw.notifications || initialNotifications,
    scoringMatrix,
    history: raw.history || [],
  };
}

function loadAll() {
  return hydrate({
    users: loadJson(STORAGE_KEYS.USERS, initialUsers),
    achievements: loadJson(STORAGE_KEYS.ACHIEVEMENTS, null),
    submissions: loadJson(STORAGE_KEYS.SUBMISSIONS, null),
    applications: loadJson(STORAGE_KEYS.APPLICATIONS, null),
    directions: loadJson(STORAGE_KEYS.DIRECTIONS, initialDirections),
    regulations: loadJson(STORAGE_KEYS.REGULATIONS, initialRegulations),
    faculties: loadJson(STORAGE_KEYS.FACULTIES, initialFaculties),
    groups: loadJson(STORAGE_KEYS.GROUPS, initialGroups),
    tooltips: loadJson(STORAGE_KEYS.TOOLTIPS, initialTooltips),
    notifications: loadJson(STORAGE_KEYS.NOTIFICATIONS, initialNotifications),
    scoringMatrix: loadJson(STORAGE_KEYS.SCORING_MATRIX, defaultScoringMatrix),
    history: loadJson(STORAGE_KEYS.HISTORY, []),
  });
}

function persist(key, stateKey) {
  return (state) => saveJson(key, state[stateKey]);
}

export const reloadData = createAsyncThunk('data/reload', async () => {
  if (!getToken()) return loadAll();

  try {
    const remote = await fetchBootstrapData();
    return hydrate(remote);
  } catch {
    return loadAll();
  }
});

const initial = loadAll();

const dataSlice = createSlice({
  name: 'data',
  initialState: { loaded: true, ...initial },
  reducers: {
    setUsers(state, action) {
      state.users = migrateUsers(action.payload, state.faculties);
      persist(STORAGE_KEYS.USERS, 'users')(state);
    },
    setAchievements(state, action) {
      state.achievements = action.payload;
      persist(STORAGE_KEYS.ACHIEVEMENTS, 'achievements')(state);
    },
    setSubmissions(state, action) {
      state.submissions = action.payload;
      persist(STORAGE_KEYS.SUBMISSIONS, 'submissions')(state);
    },
    setDirections(state, action) {
      state.directions = action.payload;
      persist(STORAGE_KEYS.DIRECTIONS, 'directions')(state);
    },
    setRegulations(state, action) {
      state.regulations = action.payload;
      persist(STORAGE_KEYS.REGULATIONS, 'regulations')(state);
    },
    setFaculties(state, action) {
      state.faculties = action.payload;
      persist(STORAGE_KEYS.FACULTIES, 'faculties')(state);
    },
    setGroups(state, action) {
      state.groups = action.payload;
      persist(STORAGE_KEYS.GROUPS, 'groups')(state);
    },
    setTooltips(state, action) {
      state.tooltips = action.payload;
      persist(STORAGE_KEYS.TOOLTIPS, 'tooltips')(state);
    },
    setNotifications(state, action) {
      state.notifications = action.payload;
      persist(STORAGE_KEYS.NOTIFICATIONS, 'notifications')(state);
    },
    setScoringMatrix(state, action) {
      state.scoringMatrix = action.payload;
      persist(STORAGE_KEYS.SCORING_MATRIX, 'scoringMatrix')(state);
    },
    setHistory(state, action) {
      state.history = action.payload;
      persist(STORAGE_KEYS.HISTORY, 'history')(state);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(reloadData.fulfilled, (state, action) => {
      Object.assign(state, action.payload, { loaded: true });
    });
  },
});

export const {
  setUsers,
  setAchievements,
  setSubmissions,
  setDirections,
  setRegulations,
  setFaculties,
  setGroups,
  setTooltips,
  setNotifications,
  setScoringMatrix,
  setHistory,
} = dataSlice.actions;

export const setApplications = setAchievements;

export default dataSlice.reducer;
