/**
 * mapPanel.js — schematic map surface with pins for the current result set
 * (or the exact 1–2 stays being compared). This is an illustrative,
 * deterministically-positioned placeholder, not a real tile/geocoding
 * integration — swap the surface for a real map SDK (e.g. Google Maps,
 * Mapbox) later. Rendered inside a modal (see workspace.js's "Map" button
 * and comparison view), so pins are inert markers with a name tooltip
 * rather than clickable — there's no results list visible underneath to
 * scroll to while the modal is open.
 */

import { escapeHTML } from '../utilities/helpers.js';

/** Deterministic pseudo-position so the same property always lands in the same spot. */
function pinPosition(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const top = 14 + (hash % 68);
  const left = 12 + ((hash >> 5) % 72);
  return { top, left };
}

/**
 * @param {Array} properties — up to 6 properties to pin
 * @param {{labels?: string[]}} [opts] — override pin labels (used in compare mode: ['A','B'])
 */
export function renderMapPanel(properties, { labels = null } = {}) {
  const items = properties.slice(0, 6);

  if (!items.length) {
    return `
      <div class="map-panel__surface map-panel__surface--empty">
        <div class="map-panel__placeholder">🗺️<br>Results will appear here</div>
      </div>
    `;
  }

  const pins = items.map((p, i) => {
    const label = labels ? labels[i] : String.fromCharCode(65 + i);
    const { top, left } = pinPosition(p.id);
    return `
      <button class="map-pin" style="top:${top}%; left:${left}%;"
        data-action="focus-property" data-property-id="${p.id}"
        title="${escapeHTML(p.name)}">
        <span>${label}</span>
      </button>
    `;
  }).join('');

  return `
    <div class="map-panel__surface">
      <div class="map-panel__terrain" aria-hidden="true"></div>
      ${pins}
    </div>
    <div class="map-panel__caption">Map view — illustrative · ${items.length} ${items.length === 1 ? 'stay' : 'stays'} shown</div>
  `;
}
