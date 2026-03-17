const AUTH_TOKEN_KEY = "roleplay_ai_token";
const isLocalHost = typeof window !== "undefined" && (
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
);

export const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  (isLocalHost ? "http://localhost:8080" : "https://roleplay-ai-rob1.onrender.com");

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
