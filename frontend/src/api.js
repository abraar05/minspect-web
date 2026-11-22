const TOKEN_KEY = 'minspect.token';
export const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
export const API_CONFIGURED = API_BASE.startsWith('/') || !/(example\.com|your-|placeholder)/i.test(API_BASE);

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function api(path, { method = 'GET', body, ...options } = {}) {
  const token = getToken();
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    ...options,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message || 'Request failed');
    error.status = response.status;
    error.errors = payload.errors || {};
    throw error;
  }
  return payload;
}
