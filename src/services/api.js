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

async function request(path, { method = 'GET', body, params } = {}) {
  const url = new URL(`${API_BASE}${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`${method} ${path} failed: ${res.status} ${res.statusText}`);
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

// ── Auth (NOT YET ON BACKEND) ───────────────────────────────
// No user-account service is specced yet — these are real REST calls
// against sensible paths so the frontend is ready the moment one exists.
// Until then, services/authStore.js catches the failure and falls back to
// a local-only demo account so the login/signup flow is still usable —
// see that file for the details, and README for what a real
// implementation needs to return.

/** POST /api/auth/signup { name, email, password } */
export async function signUp(payload) {
  return request('/api/auth/signup', { method: 'POST', body: payload });
}

/** POST /api/auth/login { email, password } */
export async function login(payload) {
  return request('/api/auth/login', { method: 'POST', body: payload });
}
