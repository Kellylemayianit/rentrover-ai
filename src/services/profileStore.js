/**
 * profileStore.js — a lightweight, local-only profile (name + contact),
 * NOT an account/login system. There's no server-side auth in this app;
 * this just remembers who to say the booking is for so it can prefill
 * the "talk to our team" messages. Persisted in localStorage so it
 * survives a refresh (unlike cartStore/ordersStore, which are per-session).
 */

const STORAGE_KEY = 'rentrover_profile';
const _listeners = [];

export function onChange(fn) {
  _listeners.push(fn);
}

function _notify(profile) {
  _listeners.forEach(fn => fn(profile));
}

export function getProfile() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { name: '', contact: '' };
  } catch {
    return { name: '', contact: '' };
  }
}

/** @param {{name?:string, contact?:string}} fields */
export function saveProfile(fields) {
  const profile = { ...getProfile(), ...fields };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(profile)); } catch { /* storage unavailable — profile just won't persist */ }
  _notify(profile);
  return profile;
}
