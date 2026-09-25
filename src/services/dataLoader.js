/**
 * dataLoader.js — the ONLY data import surface pages/components should use.
 * Adds a light in-memory cache on top of api.js so switching routes doesn't
 * re-fetch the whole catalog every time. Call `invalidate()` after writes
 * (e.g. from an admin form) to force a refetch.
 *
 * All data now comes from the live backend via api.js — there is no local
 * fallback data, so a backend outage surfaces as a thrown error. Callers
 * (pages/) are expected to catch and show an appropriate empty/error state.
 */

import * as api from './api.js';

let _propertiesCache = null;
let _destinationsCache = null;

export async function loadProperties({ force = false } = {}) {
  if (!_propertiesCache || force) {
    _propertiesCache = await api.fetchProperties();
  }
  return _propertiesCache;
}

export async function loadProperty(id) {
  const cached = _propertiesCache?.find(p => p.id === id);
  if (cached) return cached;
  return api.fetchPropertyById(id);
}

export async function loadSearch(query, filters) {
  // Search always hits the network — results are query-specific.
  return api.searchProperties(query, filters);
}

export async function loadDestinations({ force = false } = {}) {
  if (!_destinationsCache || force) {
    _destinationsCache = await api.fetchDestinations();
  }
  return _destinationsCache;
}

export async function loadBookings() {
  return api.fetchBookings();
}

export async function loadDashboardStats() {
  return api.fetchDashboardStats();
}

export async function submitBookingEnquiry(payload) {
  const record = await api.createBookingEnquiry(payload);
  invalidate();
  return record;
}

/** Create a new property (admin) or update an existing one if `id` is set. */
export async function saveProperty(payload) {
  const record = payload.id
    ? await api.updateProperty(payload.id, payload)
    : await api.createProperty(payload);
  invalidate();
  return record;
}

export async function removeProperty(id) {
  await api.deleteProperty(id);
  invalidate();
}

/** Drop cached data so the next load* call refetches. */
export function invalidate() {
  _propertiesCache = null;
  _destinationsCache = null;
}
