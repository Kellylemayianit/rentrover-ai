/**
 * admin/propertyTable.js — admin tables for properties and bookings.
 * Rendering only; app.js wires data-action clicks (edit/delete/view).
 */

import { escapeHTML, formatPrice, formatDate } from '../../utilities/helpers.js';
import { ICONS } from '../../utilities/icons.js';

export function renderPropertiesTable(properties) {
  const rows = properties.map(p => `
    <tr data-property-id="${p.id}">
      <td>
        <div class="admin-table__cell-flex">
          <img class="admin-table__thumb" src="${p.image}" alt="">
          <div>
            <div style="font-weight:600;">${escapeHTML(p.name)}</div>
            <div class="text-muted body-sm">${escapeHTML(p.city)}, ${escapeHTML(p.country)}</div>
          </div>
        </div>
      </td>
      <td>${escapeHTML(p.type)}</td>
      <td>${formatPrice(p.pricePerNight, p.currency)}</td>
      <td>⭐ ${p.rating}</td>
      <td>
        <button class="table-action" data-action="edit-property" data-property-id="${p.id}" aria-label="Edit">${ICONS.edit}</button>
        <button class="table-action" data-action="delete-property" data-property-id="${p.id}" aria-label="Delete">${ICONS.trash}</button>
      </td>
    </tr>
  `).join('');

  return `
    <table class="admin-table">
      <thead><tr><th>Property</th><th>Type</th><th>Price / night</th><th>Rating</th><th></th></tr></thead>
      <tbody>${rows || `<tr><td colspan="5" class="text-muted text-center" style="padding:2rem;">No properties yet.</td></tr>`}</tbody>
    </table>
  `;
}

const STATUS_BADGE = {
  confirmed: 'badge--success',
  pending: 'badge--warning',
  cancelled: 'badge--danger',
};

export function renderBookingsTable(bookings, propertiesById = {}) {
  const rows = bookings.map(b => {
    const prop = propertiesById[b.propertyId];
    return `
      <tr data-booking-id="${b.id}">
        <td style="font-weight:600;">${escapeHTML(b.guestName)}</td>
        <td>${prop ? escapeHTML(prop.name) : escapeHTML(b.propertyId)}</td>
        <td>${formatDate(b.checkIn)} → ${formatDate(b.checkOut)}</td>
        <td>${b.guests}</td>
        <td><span class="badge ${STATUS_BADGE[b.status] || 'badge--neutral'}">${escapeHTML(b.status)}</span></td>
      </tr>
    `;
  }).join('');

  return `
    <table class="admin-table">
      <thead><tr><th>Guest</th><th>Property</th><th>Dates</th><th>Guests</th><th>Status</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="5" class="text-muted text-center" style="padding:2rem;">No bookings yet.</td></tr>`}</tbody>
    </table>
  `;
}
