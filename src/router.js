/**
 * router.js — hash parsing + change subscription.
 * Routes are plain arrays: ['dashboard', 'properties'] for #/dashboard/properties.
 * app.js is the only consumer; it maps segments to page render functions.
 */

const _listeners = [];

function parseHash() {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const [pathPart, queryPart] = raw.split('?');
  const segments = pathPart.split('/').filter(Boolean);
  const query = new URLSearchParams(queryPart || '');
  return { segments, query, raw };
}

export function getRoute() {
  return parseHash();
}

export function onRouteChange(fn) {
  _listeners.push(fn);
}

function _dispatch() {
  const route = parseHash();
  _listeners.forEach(fn => fn(route));
}

export function initRouter() {
  window.addEventListener('hashchange', _dispatch);
  window.addEventListener('DOMContentLoaded', _dispatch);
  // If DOMContentLoaded already fired before this module attached, dispatch now.
  if (document.readyState !== 'loading') _dispatch();
}

export function navigate(hash) {
  window.location.hash = hash;
}
