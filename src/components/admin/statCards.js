/**
 * admin/statCards.js — the 4-up stat card row on the dashboard overview.
 */

import { formatPrice } from '../../utilities/helpers.js';

/** @param {{properties:number, bookings:number, pendingBookings:number, avgRating:number}} stats */
export function renderStatCards(stats) {
  const cards = [
    { icon: '🏠', label: 'Total properties', value: stats.properties, delta: null },
    { icon: '📅', label: 'Total bookings', value: stats.bookings, delta: null },
    { icon: '⏳', label: 'Pending enquiries', value: stats.pendingBookings, delta: stats.pendingBookings > 0 ? `${stats.pendingBookings} need review` : 'All caught up' },
    { icon: '⭐', label: 'Average rating', value: stats.avgRating, delta: null },
  ];

  return `
    <div class="stat-cards">
      ${cards.map(c => `
        <div class="stat-card">
          <div class="stat-card__top">
            <div class="stat-card__icon">${c.icon}</div>
          </div>
          <div class="stat-card__value">${c.value}</div>
          <div class="stat-card__label">${c.label}${c.delta ? ` · ${c.delta}` : ''}</div>
        </div>
      `).join('')}
    </div>
  `;
}
