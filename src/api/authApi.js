import { apiRequest, setToken } from './client';

export async function loginApi(email, password) {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  return data.user;
}

export async function registerApi(form) {
  const data = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(form),
  });
  setToken(data.token);
  return data.user;
}

export async function meApi() {
  const data = await apiRequest('/auth/me');
  return data.user;
}

export async function logoutApi() {
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } catch {
    // session may already be invalid
  }
  setToken(null);
}
