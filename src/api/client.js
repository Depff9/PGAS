const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const TOKEN_KEY = 'pgas_api_token';

let onUnauthorized = null;

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (!token) {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }
  localStorage.setItem(TOKEN_KEY, token);
}

export async function apiRequest(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    setToken(null);
    onUnauthorized?.();
  }

  if (response.status === 204) return null;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      data?.error ||
      data?.message ||
      (response.status === 403
        ? 'Недостаточно прав для этого действия'
        : response.status === 404
          ? 'Запрашиваемые данные не найдены'
          : response.status >= 500
            ? 'Ошибка сервера. Попробуйте позже'
            : 'Не удалось выполнить запрос');
    throw new Error(message);
  }
  return data;
}

export { API_BASE_URL };
