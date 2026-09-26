/**
 * cartStore.js — cart state, persisted to localStorage so it survives a
 * refresh (what the old build called an "itinerary" — renamed because
 * nobody talks like that). Pages/components read it through the
 * functions below and subscribe via onChange().
 */

const STORAGE_KEY = 'rentrover_cart';
const _listeners = [];

function _read() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}
function _write(cart) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch { /* not persisted this session */ }
}

export function onChange(fn) {
  _listeners.push(fn);
}

function _notify() {
  _listeners.forEach(fn => fn(getCart()));
}

/**
 * @param {Object} property — a property object from the catalog
 * @returns {boolean} true if added, false if it was already in the cart
 */
export function addToCart(property) {
  const cart = _read();
  if (cart.some(item => item.id === property.id)) return false;
  cart.push({
    id: property.id,
    name: property.name,
    type: property.type,
    location: `${property.city}, ${property.country}`,
    priceEstimate: `${property.currency || 'USD'} ${property.pricePerNight}/night`,
    emoji: property.emoji || '🏠',
    sources: property.sources || [],
    city: property.city,
    country: property.country,
  });
  _write(cart);
  _notify();
  return true;
}

export function removeFromCart(id) {
  _write(_read().filter(item => item.id !== id));
  _notify();
}

export function isInCart(id) {
  return _read().some(item => item.id === id);
}

export function getCart() {
  return _read();
}

export function getCartCount() {
  return _read().length;
}

export function clearCart() {
  _write([]);
  _notify();
}
