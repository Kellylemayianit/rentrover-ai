/**
 * header.js — pure render function for the public site nav.
 * app.js wires the delegated click/scroll behaviour; this file only builds markup.
 */

import { ICONS } from '../utilities/icons.js';

/**
 * @param {{activeRoute?:string, cartCount?:number}} opts
 * @returns {string} HTML
 */
export function renderHeader({ activeRoute = '', cartCount = 0 } = {}) {
  const link = (href, label, route) =>
    `<a href="${href}" class="nav__link${activeRoute === route ? ' nav__link--active' : ''}">${label}</a>`;

  return `
    <nav class="nav" id="site-nav" data-component="header">
      <a href="#/" class="nav__logo">
        <div class="nav__logo-mark">🧭</div>
        <span class="nav__logo-text">RentRover AI</span>
      </a>
      <div class="nav__links">
        ${link('#/', 'Home', 'home')}
        ${link('#/app', 'Find a stay', 'app')}
        ${link('#/login', 'Admin', 'login')}
      </div>
      <div class="nav__actions">
        <button class="cart-badge" id="cart-badge" data-action="open-cart-pane" aria-label="View cart">
          ${ICONS.bag}
          <span>Cart</span>
          <span class="cart-badge__count" id="cart-count">${cartCount}</span>
        </button>
      </div>
    </nav>
  `;
}
