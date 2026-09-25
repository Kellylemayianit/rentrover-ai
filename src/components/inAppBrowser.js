/**
 * inAppBrowser.js — a full-screen in-app browser overlay so checkout on
 * Booking.com / Airbnb / Trip.com happens without leaving the site.
 *
 * Honest limitation: most booking platforms send X-Frame-Options / CSP
 * headers that refuse to render inside an <iframe> — there's no reliable
 * way to detect that from the parent page (cross-origin load "succeeds"
 * from the browser's point of view even when the site inside refuses to
 * paint). So this always shows a visible "Open in a new tab instead" escape
 * hatch rather than pretending the embed will always work.
 */

import { escapeHTML } from '../utilities/helpers.js';

const ROOT_ID = 'rr-inapp-browser-root';

function ensureRoot() {
  let root = document.getElementById(ROOT_ID);
  if (!root) {
    root = document.createElement('div');
    root.id = ROOT_ID;
    document.body.appendChild(root);
  }
  return root;
}

/** @param {{platform:string, url:string}} opts */
export function openInAppBrowser({ platform, url }) {
  const root = ensureRoot();
  root.innerHTML = `
    <div class="inapp-browser" data-component="inapp-browser">
      <div class="inapp-browser__bar">
        <div class="inapp-browser__title">Booking via ${escapeHTML(platform)}</div>
        <div class="inapp-browser__actions">
          <a class="btn btn--sm btn--outline" href="${url}" target="_blank" rel="noopener">Open in new tab ↗</a>
          <button class="btn btn--sm btn--dark" data-action="close-inapp-browser">Done, close</button>
        </div>
      </div>
      <div class="inapp-browser__hint">If ${escapeHTML(platform)} doesn't load below, some sites block embedding — use "Open in new tab" instead.</div>
      <iframe class="inapp-browser__frame" src="${url}" title="${escapeHTML(platform)} checkout" referrerpolicy="no-referrer"></iframe>
    </div>
  `;
}

export function closeInAppBrowser() {
  const root = document.getElementById(ROOT_ID);
  if (root) root.innerHTML = '';
}
