/**
 * propertyRegistry.js — a tiny shared, in-memory lookup of every property
 * object any page has fetched this session, keyed by id.
 *
 * Why this exists: cartStore.addToCart() needs the FULL property object
 * (image, city, price, sources…), but click handlers only have the id from
 * a data-attribute. Whichever page fetched the data (home.js's featured
 * grid, workspace.js's search) registers it here, so "Add to cart" works
 * the same way regardless of which page the click happened on.
 */

const registry = {};

/** @param {Array} properties */
export function registerProperties(properties = []) {
  properties.forEach(p => { if (p && p.id) registry[p.id] = p; });
}

/** @param {string} id @returns {Object|undefined} */
export function getProperty(id) {
  return registry[id];
}
