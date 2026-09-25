/**
 * api.js — live HTTP client for the RentRover search backend.
 *
 * No mock/local data lives here — every export fires a real fetch()
 * against API_BASE. The only endpoint this app needs is the combined
 * search — Stays lists results from it, and Ask answers questions
 * grounded in whatever Stays already loaded (see utilities/askEngine.js)
 * rather than hitting the network again.
 *
 * Normalized Property shape expected back from the backend:
 *   { id, name, type, city, country, region, description,
 *     pricePerNight, currency, rating, reviewCount, tags, amenities,
 *     image, gallery, emoji, sources: [{ platform, price, url, cancellation }] }
 */

// TODO: point this at your deployed search backend. Empty = same-origin.
const API_BASE = '';

const DEFAULT_TIMEOUT_MS = 12000;

async function request(path, { params } = {}) {
  const url = new URL(`${API_BASE}${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, signal: controller.signal });
    if (!res.ok) throw new Error(`GET ${path} failed: ${res.status} ${res.statusText}`);
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * GET /api/search/combined?q=&region=&type=&maxPrice=
 * Dispatches the scraper orchestrator (Airbnb + Booking.com + Google Maps
 * via proxy pool) and returns normalized, cross-platform-merged results.
 */
export async function searchProperties(query = '', filters = {}) {
  return request('/api/search/combined', {
    params: { q: query, region: filters.region, type: filters.type, maxPrice: filters.maxPrice },
  });
}

/** Default/unfiltered catalog — reuses the same endpoint with no query. */
export async function fetchProperties() {
  return searchProperties('', {});
}
