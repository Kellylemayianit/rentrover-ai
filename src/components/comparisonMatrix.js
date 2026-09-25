/**
 * comparisonMatrix.js — side-by-side comparison table for up to 2 stays,
 * merging each property's `sources` (Airbnb, Booking.com, …) into one
 * "live pricing" row per platform instead of separate tabs per site.
 */

import { escapeHTML, formatPrice } from '../utilities/helpers.js';

/** @param {Array} properties — up to 2 full property objects, in column order */
export function renderComparisonMatrix(properties) {
  if (!properties.length) {
    return `<p class="text-muted text-center" style="padding:3rem;">Pick two stays from the chat to compare them here.</p>`;
  }

  const cols = properties.map((p, i) => ({ p, label: String.fromCharCode(65 + i) }));
  const colCount = cols.length;

  const headerCells = cols.map(({ p, label }) => `
    <th>
      <span class="compare-pin-badge">${label}</span>
      ${escapeHTML(p.name)}
    </th>`).join('');

  const rows = [
    {
      label: 'Location',
      cells: cols.map(({ p }) => `📍 ${escapeHTML(p.city)}, ${escapeHTML(p.country)}`),
    },
    {
      label: 'Photos',
      cells: cols.map(({ p }) => `
        <div class="compare-gallery">
          ${(p.gallery || [p.image]).slice(0, 2).map(src => `<img src="${src}" alt="${escapeHTML(p.name)}" loading="lazy">`).join('')}
        </div>`),
    },
    {
      label: 'Amenities',
      cells: cols.map(({ p }) => `
        <ul class="compare-amenities">
          ${(p.amenities || []).slice(0, 5).map(a => `<li>${escapeHTML(a)}</li>`).join('')}
        </ul>`),
    },
    {
      label: 'Reviews (all sources)',
      cells: cols.map(({ p }) => `
        <div class="compare-rating">⭐ ${p.rating}</div>
        <div class="text-muted body-sm">${p.reviewCount || 0} reviews · all sources</div>`),
    },
    {
      label: 'Live pricing',
      cells: cols.map(({ p }) => `
        ${(p.sources || []).map(s => `
          <div class="compare-price-row">
            <span class="compare-price-platform">${escapeHTML(s.platform)}</span>
            <span class="compare-price-amount">${formatPrice(s.price, p.currency)}</span>
            <a href="${s.url}" target="_blank" rel="noopener" class="compare-price-link">Book →</a>
          </div>
          <div class="text-muted body-sm" style="margin-bottom:.5rem;">${escapeHTML(s.cancellation)}</div>
        `).join('')}`),
    },
  ];

  const bodyRows = rows.map(row => `
    <tr>
      <td class="compare-row-label">${row.label}</td>
      ${row.cells.map(cell => `<td>${cell}</td>`).join('')}
    </tr>
  `).join('');

  return `
    <table class="comparison-table" style="--compare-cols:${colCount};">
      <thead><tr><th></th>${headerCells}</tr></thead>
      <tbody>${bodyRows}</tbody>
    </table>
  `;
}
