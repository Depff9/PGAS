import { createSlice } from '@reduxjs/toolkit';
import { setToken } from '../api/client';

const session = (() => {
  try {
    const raw = localStorage.getItem('pgas_session_api');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
})();

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
      localStorage.setItem('pgas_session_api', JSON.stringify(action.payload));
    },
    loginFailure(state, action) {
      state.error = action.payload;
    },
    logout(state) {
      state.user = null;
      state.error = null;
      localStorage.removeItem('pgas_session_api');
      setToken(null);
    },
    updateProfile(state, action) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem('pgas_session_api', JSON.stringify(state.user));
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
