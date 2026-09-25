/**
 * dataLoader.js — the ONLY data import surface pages/components use.
 * Thin wrapper over api.js with a light cache for the default catalog
 * (loaded once so Stays isn't empty before the user searches).
 */

import * as api from './api.js';

let _propertiesCache = null;

export async function loadProperties({ force = false } = {}) {
  if (!_propertiesCache || force) {
    _propertiesCache = await api.fetchProperties();
  }
  return _propertiesCache;
}

/** Search always hits the network — results are query-specific. */
export async function loadSearch(query, filters) {
  return api.searchProperties(query, filters);
}
