const AUTH_TOKEN_KEY = "roleplay_ai_token";

export function getAuthToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token) {
  try {
    if (!token) return;
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch {
    // ignore storage errors (private mode, blocked storage, etc.)
  }
}

export function clearAuthToken() {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // ignore
  }
}

