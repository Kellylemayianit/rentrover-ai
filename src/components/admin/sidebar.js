/**
 * admin/sidebar.js — dashboard sidebar (desktop) + bottom nav (mobile).
 * Both render from the same nav item list so they never fall out of sync.
 */

import { ICONS } from '../../utilities/icons.js';
import { currentUser } from '../../utilities/auth.js';

const NAV_ITEMS = [
  { route: 'overview',   label: 'Overview',   icon: ICONS.chart },
  { route: 'properties', label: 'Properties', icon: ICONS.bed },
  { route: 'bookings',   label: 'Bookings',   icon: ICONS.users },
];

export function renderSidebar(activeRoute = 'overview') {
  const user = currentUser();
  const links = NAV_ITEMS.map(item => `
    <a href="#/dashboard/${item.route}" class="admin-sidebar__link${activeRoute === item.route ? ' admin-sidebar__link--active' : ''}">
      ${item.icon}<span>${item.label}</span>
    </a>
  `).join('');

  return `
    <aside class="admin-sidebar" data-component="admin-sidebar">
      <div class="admin-sidebar__logo"><span>🧭</span><span>RentRover Admin</span></div>
      <nav class="admin-sidebar__nav">${links}</nav>
      <div class="admin-sidebar__footer">
        ${user ? `Signed in as<br><strong style="color:#fff;">${user.email}</strong>` : ''}
        <button class="admin-sidebar__logout" data-action="admin-logout">${ICONS.logout} Log out</button>
      </div>
    </aside>
  `;
}

export function renderBottomNav(activeRoute = 'overview') {
  const links = NAV_ITEMS.map(item => `
    <a href="#/dashboard/${item.route}" class="admin-bottom-nav__link${activeRoute === item.route ? ' admin-bottom-nav__link--active' : ''}">
      ${item.icon}<span>${item.label}</span>
    </a>
  `).join('');
  return `<nav class="admin-bottom-nav" data-component="admin-bottom-nav">${links}</nav>`;
}
