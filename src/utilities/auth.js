/**
 * auth.js — mock admin login + in-memory session flag.
 * Swap `_validate()` for a real API call once a backend exists;
 * everything else (session flag, guard) can stay as-is.
 */

const SESSION_KEY = 'rr_admin_session';
const DEMO_USER = { email: 'admin@rentrover.ai', password: 'demo1234' };

function _validate(email, password) {
  // MOCK — replace with a real auth endpoint call.
  return email.trim().toLowerCase() === DEMO_USER.email && password === DEMO_USER.password;
}

export function login(email, password) {
  if (_validate(email, password)) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ email, at: Date.now() }));
    return true;
  }
  return false;
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function isLoggedIn() {
  return !!sessionStorage.getItem(SESSION_KEY);
}

export function currentUser() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

/** Redirect to #/login if not authenticated. Call at the top of any admin page render fn. */
export function requireAuth() {
  if (!isLoggedIn()) {
    window.location.hash = '#/login';
    return false;
  }
  return true;
}
