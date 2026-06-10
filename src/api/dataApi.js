import { apiRequest } from './client';

export async function fetchBootstrapData() {
  const [
    users,
    directions,
    faculties,
    groups,
    tooltips,
    regulations,
    scoringMatrix,
    submissions,
    achievements,
    notifications,
    history,
  ] = await Promise.all([
    apiRequest('/users').catch(() => []),
    apiRequest('/reference/directions'),
    apiRequest('/reference/faculties'),
    apiRequest('/reference/groups'),
    apiRequest('/reference/tooltips'),
    apiRequest('/reference/regulations'),
    apiRequest('/reference/scoring-matrix'),
    apiRequest('/submissions'),
    apiRequest('/achievements'),
    apiRequest('/notifications'),
    apiRequest('/history').catch(() => []),
  ]);

  return {
    users,
    directions,
    faculties,
    groups,
    tooltips,
    regulations,
    scoringMatrix,
    submissions,
    achievements,
    notifications,
    history,
  };
}

export const dataApi = {
  createSubmission: (payload) =>
    apiRequest('/submissions', { method: 'POST', body: JSON.stringify(payload) }),
  listSubmissions: () => apiRequest('/submissions'),
  updateSubmissionStatus: (id, status) =>
    apiRequest(`/submissions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
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
  updateScoringMatrix: (payload) =>
    apiRequest('/reference/scoring-matrix', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  updateDirection: (id, payload) =>
    apiRequest(`/reference/directions/${id}`, {
      method: 'PATCH',
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
    return apiRequest('/reference/tooltips', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  deleteTooltip: (id) =>
    apiRequest(`/reference/tooltips/${id}`, { method: 'DELETE' }),

  markNotificationRead: (id) =>
    apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }),

  updateUser: (id, payload) =>
    apiRequest(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  createUser: (payload) =>
    apiRequest('/users', { method: 'POST', body: JSON.stringify(payload) }),
  deleteUser: (id) =>
    apiRequest(`/users/${id}`, { method: 'DELETE' }),
  updateOwnProfile: (payload) =>
    apiRequest('/users/me/profile', { method: 'PATCH', body: JSON.stringify(payload) }),
};
