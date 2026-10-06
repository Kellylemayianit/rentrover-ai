/**
 * ordersStore.js — booking/order tracking for the Cart pane, persisted to
 * localStorage so signing in and refreshing doesn't lose them (this is
 * what lets someone "manage their bookings" across visits).
 *
 * IMPORTANT: there is no order-management backend yet (see README — only
 * /api/search/combined, and now /api/auth/*, are live/specced). So this
 * data lives only in the browser, and "marking progress automatically" is
 * simulated with a timer that steps each order through a fixed status
 * sequence, clearly for demo purposes. Replace `_simulateProgress` with
 * real status updates (a webhook from the booking platform, or a poll
 * against a real `/api/orders/:id`) once that backend exists — everything
 * else (the store shape, onChange, getOrders) can stay as-is.
 */

import { currentUser } from './authStore.js';

const STORAGE_KEY = 'rentrover_orders';
const STATUS_SEQUENCE = ['Requested', 'Confirmed', 'Upcoming stay', 'Completed'];
const SIMULATED_STEP_MS = 45000; // demo pacing — a real backend would push updates instead

const _listeners = [];

function _readAll() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}
function _writeAll(orders) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(orders)); } catch { /* not persisted this session */ }
}

export function onChange(fn) {
  _listeners.push(fn);
}

function _notify() {
  _listeners.forEach(fn => fn(getOrders()));
}

/**
 * @param {{items:Array, platform:string, checkIn?:string, checkOut?:string}} payload
 * @returns {Object} the created order
 */
export function createOrder({ items, platform, checkIn = '', checkOut = '' }) {
  const user = currentUser();
  const order = {
    id: `ord-${Date.now()}`,
    ownerEmail: user ? user.email : null, // null = a guest order, made before signing in
    items, platform, checkIn, checkOut,
    status: STATUS_SEQUENCE[0],
    createdAt: Date.now(),
  };
  _writeAll([order, ..._readAll()]);
  _notify();
  _simulateProgress(order.id);
  return order;
}

/**
 * Orders for the current visitor: their own if signed in, otherwise any
 * guest orders made this browser hasn't attributed to an account yet.
 */
export function getOrders() {
  const user = currentUser();
  const all = _readAll();
  return user ? all.filter(o => o.ownerEmail === user.email) : all.filter(o => !o.ownerEmail);
}

/** Attach any guest orders made before signing in to the now-current account. */
export function claimGuestOrders() {
  const user = currentUser();
  if (!user) return;
  const all = _readAll();
  let changed = false;
  const updated = all.map(o => {
    if (!o.ownerEmail) { changed = true; return { ...o, ownerEmail: user.email }; }
    return o;
  });
  if (changed) { _writeAll(updated); _notify(); }
}

function _simulateProgress(orderId) {
  let step = 0;
  const tick = () => {
    step++;
    if (step >= STATUS_SEQUENCE.length) return;
    const all = _readAll().map(o => o.id === orderId ? { ...o, status: STATUS_SEQUENCE[step] } : o);
    _writeAll(all);
    _notify();
    setTimeout(tick, SIMULATED_STEP_MS);
  };
  setTimeout(tick, SIMULATED_STEP_MS);
}
