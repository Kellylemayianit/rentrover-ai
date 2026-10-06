/**
 * authStore.js — sign up / log in / log out, with a real backend call
 * first and a local-only demo fallback so the flow works today.
 *
 * There's no user-account backend yet (see api.js / README). Every call
 * here tries the real endpoint first; if that fails (no route there
 * yet), it falls back to a small localStorage-backed account store —
 * clearly a demo, NOT secure (passwords are only lightly obscured, not
 * properly hashed), and it's the reason "measuring users" doesn't
 * actually work until a real backend exists: this data never leaves the
 * browser. Swap `_localSignUp` / `_localLogin` out once `/api/auth/*` is
 * live — `signUp()`/`login()`'s return shape stays the same either way,
 * so nothing else in the app needs to change.
 */

import * as api from './api.js';

const USERS_KEY = 'rentrover_users';
const SESSION_KEY = 'rentrover_session';
const _listeners = [];

function _readUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || {}; } catch { return {}; }
}
function _writeUsers(users) {
  try { localStorage.setItem(USERS_KEY, JSON.stringify(users)); } catch { /* not persisted this session */ }
}
// Demo-only obfuscation so a password isn't sitting in localStorage as
// plain text — this is NOT real password hashing, don't treat it as secure.
function _obscure(password) {
  try { return btoa(unescape(encodeURIComponent(password))); } catch { return password; }
}

function _setSession(user) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(user)); } catch { /* not persisted this session */ }
  _listeners.forEach(fn => fn(user));
}

function _localSignUp({ name, email, password }) {
  const users = _readUsers();
  if (users[email]) return { ok: false, error: 'An account with that email already exists.' };
  users[email] = { name, email, password: _obscure(password) };
  _writeUsers(users);
  const user = { name, email };
  _setSession(user);
  return { ok: true, user, demo: true };
}

function _localLogin({ email, password }) {
  const users = _readUsers();
  const record = users[email];
  if (!record || record.password !== _obscure(password)) {
    return { ok: false, error: 'No account matches that email and password.' };
  }
  const user = { name: record.name, email: record.email };
  _setSession(user);
  return { ok: true, user, demo: true };
}

/** @param {{name:string, email:string, password:string}} fields */
export async function signUp(fields) {
  try {
    const user = await api.signUp(fields);
    _setSession(user);
    return { ok: true, user, demo: false };
  } catch (err) {
    return _localSignUp(fields);
  }
}

/** @param {{email:string, password:string}} fields */
export async function login(fields) {
  try {
    const user = await api.login(fields);
    _setSession(user);
    return { ok: true, user, demo: false };
  } catch (err) {
    return _localLogin(fields);
  }
}

export function logout() {
  try { localStorage.removeItem(SESSION_KEY); } catch { /* nothing to clear */ }
  _listeners.forEach(fn => fn(null));
}

export function currentUser() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
}

export function isLoggedIn() {
  return !!currentUser();
}

export function onChange(fn) {
  _listeners.push(fn);
}
