/**
 * cartStore.js — client-side cart state (what the old build called an
 * "itinerary" — renamed because nobody talks like that). Pages/components
 * read it through the functions below and subscribe via onChange().
 */

/** @type {Array<{id:string,name:string,type:string,location:string,priceEstimate:string,emoji:string}>} */
let cart = [];

const _listeners = [];

export function onChange(fn) {
  _listeners.push(fn);
}

function _notify() {
  _listeners.forEach(fn => fn([...cart]));
}

/**
 * @param {Object} property — a property object from the catalog
 * @returns {boolean} true if added, false if it was already in the cart
 */
export function addToCart(property) {
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
  _notify();
  return true;
}

export function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  _notify();
}

export function isInCart(id) {
  return cart.some(item => item.id === id);
}

export function getCart() {
  return [...cart];
}

export function getCartCount() {
  return cart.length;
}

export function clearCart() {
  cart = [];
  _notify();
}
