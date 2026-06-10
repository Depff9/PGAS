import { createSlice } from '@reduxjs/toolkit';
import { loadJson, saveJson, STORAGE_KEYS } from '../utils/storage';
import { setToken } from '../api/client';

const session = loadJson(STORAGE_KEYS.SESSION, null);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: session,
    error: null,
  },
  reducers: {
    loginSuccess(state, action) {
      state.user = action.payload;
      state.error = null;
      saveJson(STORAGE_KEYS.SESSION, action.payload);
    },
    loginFailure(state, action) {
      state.error = action.payload;
    },
    logout(state) {
      state.user = null;
      state.error = null;
      localStorage.removeItem('pgas_' + STORAGE_KEYS.SESSION);
      setToken(null);
    },
    updateProfile(state, action) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        saveJson(STORAGE_KEYS.SESSION, state.user);
      }
    },
    clearError(state) {
      state.error = null;
    },
  },
});

export const { loginSuccess, loginFailure, logout, updateProfile, clearError } =
  authSlice.actions;
export default authSlice.reducer;
