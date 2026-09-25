/**
 * api.js — live HTTP client for the RentRover scraper/search backend.
 *
 * No mock/local data lives here anymore — every export fires a real
 * fetch() against API_BASE. The one endpoint that's actually specced on
 * the backend today is GET /api/search/combined (see "System B" in the
 * integration notes) — everything else below is written against the
 * same normalized Property shape and a sensible REST path, but is
 * marked NOT YET ON BACKEND until that route exists server-side.
 *
 * Normalized Property shape expected back from the backend (per the
 * agreed contract):
 *   { id, name, type, city, country, region, description,
 *     pricePerNight, currency, rating, reviewCount, tags, amenities,
 *     image, gallery, emoji, sources: [{ platform, price, url, cancellation }] }
 */

// TODO: point this at your deployed scraper backend (Bun/Hono service).
// Keep it empty during local dev against a same-origin proxy, or set it
// to e.g. 'https://api.rentrover.ai'.
const API_BASE = '';

const DEFAULT_TIMEOUT_MS = 12000;

/**
 * Shared fetch wrapper: JSON-parses, throws a descriptive error on a
 * non-2xx response or timeout so callers can decide how to degrade —
 * this file never invents data to paper over a failed request.
 */
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
    if (!res.ok) {
      throw new Error(`${method} ${path} failed: ${res.status} ${res.statusText}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

// ── Search & catalog ────────────────────────────────────────

/**
 * The live endpoint: dispatches the scraper orchestrator (Airbnb +
 * Booking.com + Google Maps via proxy pool) and returns normalized,
 * cross-platform-merged results.
 * GET /api/search/combined?q=&region=&type=&maxPrice=
 * @param {string} query
 * @param {{region?:string, type?:string, maxPrice?:number}} [filters]
 */
export async function searchProperties(query = '', filters = {}) {
  return request('/api/search/combined', {
    params: { q: query, region: filters.region, type: filters.type, maxPrice: filters.maxPrice },
  });
}

/**
 * Full/default catalog for the landing page and admin table.
 * Reuses the combined search endpoint with no query — swap for a
 * dedicated /api/properties listing route if/when the backend adds one.
 */
export async function fetchProperties() {
  return searchProperties('', {});
}

/**
 * NOT YET ON BACKEND — no single-property route is specced today.
 * GET /api/properties/:id
 */
export async function fetchPropertyById(id) {
  return request(`/api/properties/${encodeURIComponent(id)}`);
}

/**
 * NOT YET ON BACKEND — editorial destination content isn't part of the
 * scraper pipeline; this would likely be a small CMS/static route
 * rather than a scrape, but is wired the same way for consistency.
 * GET /api/destinations
 */
export async function fetchDestinations() {
  return request('/api/destinations');
}

// ── Bookings / admin (NOT YET ON BACKEND) ─────────────────────
// These stay as plain REST calls against sensible paths so the frontend
// is ready the moment a bookings service exists — none of them are in
// the scraper backend spec yet.

/** GET /api/bookings */
export async function fetchBookings() {
  return request('/api/bookings');
}

/** POST /api/bookings — create a booking enquiry (WhatsApp handoff is client-side; this persists the record). */
export async function createBookingEnquiry(payload) {
  return request('/api/bookings', { method: 'POST', body: payload });
}

/** PUT /api/properties/:id — admin edit. NOT YET ON BACKEND. */
export async function updateProperty(id, payload) {
  return request(`/api/properties/${encodeURIComponent(id)}`, { method: 'PUT', body: payload });
}

/** POST /api/properties — admin create. NOT YET ON BACKEND. */
export async function createProperty(payload) {
  return request('/api/properties', { method: 'POST', body: payload });
}

/** DELETE /api/properties/:id — admin delete. NOT YET ON BACKEND. */
export async function deleteProperty(id) {
  return request(`/api/properties/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

/**
 * Computed client-side from properties + bookings rather than a
 * dedicated endpoint, to avoid requiring a route the backend doesn't
 * have yet. Swap for GET /api/dashboard/stats once one exists.
 */
export async function fetchDashboardStats() {
  const [properties, bookings] = await Promise.all([fetchProperties(), fetchBookings()]);
  const pending = bookings.filter(b => b.status === 'pending').length;
  const avgRating = properties.reduce((sum, p) => sum + (p.rating || 0), 0) / (properties.length || 1);
  return {
    properties: properties.length,
    bookings: bookings.length,
    pendingBookings: pending,
    avgRating: Math.round(avgRating * 10) / 10,
  };
}
