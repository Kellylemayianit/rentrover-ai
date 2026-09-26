/**
 * themeStore.js — light/dark theme switcher. Applies data-theme="light"
 * or "dark" on <html> (tokens.css defines both palettes off that
 * attribute), persists the choice in localStorage, and falls back to the
 * system preference (prefers-color-scheme) the first time a person visits.
 */

const STORAGE_KEY = 'rentrover_theme';
const _listeners = [];

function systemPrefersDark() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function getTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch { /* localStorage unavailable — fall through to system preference */ }
  return systemPrefersDark() ? 'dark' : 'light';
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

export function setTheme(theme) {
  applyTheme(theme);
  try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* not persisted this session */ }
  _listeners.forEach(fn => fn(theme));
}

export function toggleTheme() {
  const next = getTheme() === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}

export function onThemeChange(fn) {
  _listeners.push(fn);
}

/** Call once on boot, before first paint if possible, to avoid a flash of the wrong theme. */
export function initTheme() {
  applyTheme(getTheme());
}
