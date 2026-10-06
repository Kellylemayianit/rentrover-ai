/**
 * platformLinks.js — builds the URL to load in the in-app browser for
 * each checkout platform. Prefers a real per-listing URL from the
 * property's `sources` (returned by the search backend) and falls back
 * to that platform's public search page for the property's city when no
 * specific listing URL exists (e.g. Trip.com, which isn't in `sources`
 * at all yet — see README's endpoint-status table).
 */

const FALLBACK_SEARCH_BUILDERS = {
  'Booking.com': (p) => `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(`${p.city}, ${p.country}`)}`,
  'Airbnb':      (p) => `https://www.airbnb.com/s/${encodeURIComponent(p.city)}/homes`,
  'Trip.com':    (p) => `https://www.trip.com/hotels/list?city=${encodeURIComponent(p.city)}`,
};

export const CHECKOUT_PLATFORMS = ['Booking.com', 'Airbnb', 'Trip.com'];

/**
 * @param {string} platform — one of CHECKOUT_PLATFORMS
 * @param {Object} property — cart item / property object
 * @returns {string} a URL safe to load in the in-app browser
 */
export function buildCheckoutUrl(platform, property) {
  const source = (property.sources || []).find(s => s.platform === platform && s.url && s.url !== '#');
  if (source) return source.url;
  const fallback = FALLBACK_SEARCH_BUILDERS[platform];
  return fallback ? fallback(property) : 'about:blank';
}
