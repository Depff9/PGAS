import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { initialUsers } from '../mock/users';
import { initialDirections } from '../mock/directions';
import { initialRegulations } from '../mock/regulations';
import { initialFaculties } from '../mock/faculties';
import { initialGroups } from '../mock/groups';
import { initialTooltips } from '../mock/tooltips';
import { defaultScoringMatrix } from '../mock/scoringMatrix';
import { migrateUsers } from '../utils/migrateUser';
import { hydrateAchievements } from '../utils/migrateData';
import { fetchBootstrapData } from '../api/dataApi';

function hydrate(raw) {
  const authenticated = Boolean(raw.authenticated);
  const faculties = raw.faculties?.length ? raw.faculties : initialFaculties;
  const directions = raw.directions?.length ? raw.directions : initialDirections;
  const scoringMatrix = raw.scoringMatrix || defaultScoringMatrix;
  const users = raw.users?.length
    ? migrateUsers(raw.users, faculties)
    : raw.students?.length
      ? migrateUsers(raw.students, faculties)
      : authenticated
        ? []
        : migrateUsers(initialUsers, faculties);
  const students = migrateUsers(raw.students || [], faculties);
  const usersForRating = users.length ? users : students;

  const { achievements, submissions } = hydrateAchievements(
    {
      achievements:
        raw.achievements ?? raw.applications,
    },
    directions,
    scoringMatrix,
    raw.submissions
  );

  return {
    users: usersForRating,
    achievements,
    submissions,
    directions,
    regulations: raw.regulations || (authenticated ? null : initialRegulations),
    faculties,
    groups: raw.groups || (authenticated ? [] : initialGroups),
    tooltips: raw.tooltips || (authenticated ? [] : initialTooltips),
    notifications: raw.notifications || [],
    scoringMatrix,
    history: raw.history || [],
    meta: raw.meta || { deadlineIso: null },
  };
}

export const reloadData = createAsyncThunk('data/reload', async () => {
  const remote = await fetchBootstrapData();
  return hydrate(remote);
});

const initial = hydrate({});

const dataSlice = createSlice({
  name: 'data',
  initialState: { loaded: true, ...initial },
  reducers: {
    setUsers(state, action) {
      state.users = migrateUsers(action.payload, state.faculties);
    },
    setAchievements(state, action) {
      state.achievements = action.payload;
    },
    setSubmissions(state, action) {
      state.submissions = action.payload;
    },
    setDirections(state, action) {
      state.directions = action.payload;
    },
    setRegulations(state, action) {
      state.regulations = action.payload;
    },
    setFaculties(state, action) {
      state.faculties = action.payload;
    },
    setGroups(state, action) {
      state.groups = action.payload;
    },
    setTooltips(state, action) {
      state.tooltips = action.payload;
    },
    setNotifications(state, action) {
      state.notifications = action.payload;
    },
    setScoringMatrix(state, action) {
      state.scoringMatrix = action.payload;
    },
    setHistory(state, action) {
      state.history = action.payload;
    },
    setMeta(state, action) {
      state.meta = action.payload;
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
  setMeta,
} = dataSlice.actions;

export const setApplications = setAchievements;

export default dataSlice.reducer;
