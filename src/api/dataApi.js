import { apiRequest } from './client';
import { getToken } from './client';
import { getActiveDeadlineIso } from '../utils/submissionDeadlines';

export async function fetchPublicReferenceData() {
  return apiRequest('/reference/public');
}

export async function fetchRatingRows() {
  return apiRequest('/reference/rating');
}

export async function fetchBootstrapData() {
  const token = getToken();
  if (!token) {
    const pub = await fetchPublicReferenceData();
    return {
      authenticated: false,
      users: [],
      submissions: [],
      achievements: [],
      notifications: [],
      history: [],
      ...pub,
      meta: {
        deadlineIso: getActiveDeadlineIso(pub.regulations),
      },
    };
  }

  const [
    users,
    students,
    directions,
    faculties,
    groups,
    tooltips,
    regulations,
    submissions,
    achievements,
    notifications,
    historyRaw,
  ] = await Promise.all([
    apiRequest('/users').catch(() => []),
    apiRequest('/reference/students').catch(() => []),
    apiRequest('/reference/directions'),
    apiRequest('/reference/faculties'),
    apiRequest('/reference/groups'),
    apiRequest('/reference/tooltips'),
    apiRequest('/reference/regulations'),
    apiRequest('/submissions'),
    apiRequest('/achievements'),
    apiRequest('/notifications'),
    apiRequest('/history').catch(() => []),
  ]);

  const history = historyRaw.map((entry) => {
    const payload = entry.payload || {};
    return {
      id: entry.id,
      category: payload.category || entry.entity,
      action: payload.action || entry.action,
      summary: payload.summary || '',
      userId: payload.userId || entry.createdBy || null,
      userName: payload.userName || '',
      snapshot: payload.snapshot || null,
      targetId: payload.targetId || null,
      metadata: payload.metadata || null,
      createdAt: entry.createdAt,
    };
  });

  return {
    authenticated: true,
    users: users.length ? users : students,
    students,
    directions,
    faculties,
    groups,
    tooltips,
    regulations,
    submissions,
    achievements,
    notifications,
    history,
    meta: {
      deadlineIso: getActiveDeadlineIso(regulations),
    },
  };
}

export const dataApi = {
  saveHistoryEntry: (payload) =>
    apiRequest('/history', { method: 'POST', body: JSON.stringify(payload) }),
  listHistory: () => apiRequest('/history'),
  createSubmission: (payload) =>
    apiRequest('/submissions', { method: 'POST', body: JSON.stringify(payload) }),
  listSubmissions: () => apiRequest('/submissions'),
  updateSubmissionStatus: (id, status) =>
    apiRequest(`/submissions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  submitOwnSubmission: (id) =>
    apiRequest(`/submissions/${id}/submit`, {
      method: 'PATCH',
    }),

  createAchievement: (payload) =>
    apiRequest('/achievements', { method: 'POST', body: JSON.stringify(payload) }),
  updateAchievement: (id, payload) =>
    apiRequest(`/achievements/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteAchievement: (id) =>
    apiRequest(`/achievements/${id}`, { method: 'DELETE' }),
  listAchievements: () => apiRequest('/achievements'),

  updateRegulations: (payload) =>
    apiRequest('/reference/regulations', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  updateDirection: (id, payload) =>
    apiRequest(`/reference/directions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  createDirection: (payload) =>
    apiRequest('/reference/directions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  createFaculty: (payload) =>
    apiRequest('/reference/faculties', { method: 'POST', body: JSON.stringify(payload) }),
  updateFaculty: (id, payload) =>
    apiRequest(`/reference/faculties/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteFaculty: (id) =>
    apiRequest(`/reference/faculties/${id}`, { method: 'DELETE' }),

  createGroup: (payload) =>
    apiRequest('/reference/groups', { method: 'POST', body: JSON.stringify(payload) }),
  deleteGroup: (id) =>
    apiRequest(`/reference/groups/${id}`, { method: 'DELETE' }),

  createOrUpdateTooltip: async (payload) => {
    if (payload.id) {
      return apiRequest(`/reference/tooltips/${payload.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    }
    if (payload.fieldKey) {
      const existing = await apiRequest('/reference/tooltips');
      const byField = Array.isArray(existing)
        ? existing.find((tip) => tip.fieldKey === payload.fieldKey)
        : null;
      if (byField?.id) {
        return apiRequest(`/reference/tooltips/${byField.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ ...payload, id: byField.id }),
        });
      }
    }
    return apiRequest('/reference/tooltips', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  deleteTooltip: (id) =>
    apiRequest(`/reference/tooltips/${id}`, { method: 'DELETE' }),

  markNotificationRead: (id) =>
    apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }),
  createNotification: (payload) =>
    apiRequest('/notifications', { method: 'POST', body: JSON.stringify(payload) }),
  createNotificationsBulk: (items) =>
    apiRequest('/notifications/bulk', {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),

  updateUser: (id, payload) =>
    apiRequest(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  createUser: (payload) =>
    apiRequest('/users', { method: 'POST', body: JSON.stringify(payload) }),
  deleteUser: (id) =>
    apiRequest(`/users/${id}`, { method: 'DELETE' }),
  updateOwnProfile: (payload) =>
    apiRequest('/users/me/profile', { method: 'PATCH', body: JSON.stringify(payload) }),
};
