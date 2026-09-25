/**
 * propertyCard.js — pure render functions for property + destination cards,
 * plus the shared detail modal. app.js delegates click handling via
 * data-action attributes rendered here.
 */

import { escapeHTML, formatPrice } from '../utilities/helpers.js';

/** @param {Object} prop — a normalized property returned by the search backend @param {boolean} [added] */
export function renderPropertyCard(prop, added = false) {
  return `
    <div class="property-card" data-property-id="${prop.id}">
      <div class="property-card__image-wrap">
        <img class="property-card__image" src="${prop.image}" alt="${escapeHTML(prop.name)}" loading="lazy"
             onerror="this.parentElement.style.background='var(--color-linen)'">
        <span class="property-card__badge">${escapeHTML(prop.type)}</span>
      </div>
      <div class="property-card__body">
        <div class="property-card__location">📍 ${escapeHTML(prop.city)}, ${escapeHTML(prop.country)}</div>
        <h3 class="property-card__title">${escapeHTML(prop.name)}</h3>
        <p class="property-card__desc">${escapeHTML(prop.description)}</p>
        <div class="property-card__footer">
          <div class="property-card__price">
            Per night
            <strong>${formatPrice(prop.pricePerNight, prop.currency)}</strong>
          </div>
          <button
            class="property-card__add-btn"
            data-action="add-to-cart"
            data-property-id="${prop.id}"
            data-added="${added}"
          >${added ? '✓ Added' : '+ Add'}</button>
        </div>
      </div>
    </div>
  `;
}

export function renderPropertyGrid(properties, { addedIds = new Set() } = {}) {
  if (!properties.length) {
    return `<p class="text-muted text-center">No stays matched — try a different search.</p>`;
  }
  return `<div class="grid grid--4">${properties.map(p => renderPropertyCard(p, addedIds.has(p.id))).join('')}</div>`;
}

/** @param {{id:string,title:string,blurb:string,image:string}} dest */
export function renderDestinationCard(dest) {
  return `
    <div class="destination-card" data-action="explore-destination" data-destination-id="${dest.id}">
      <img class="destination-card__bg" src="${dest.image}" alt="${escapeHTML(dest.title)}" loading="lazy">
      <div class="destination-card__overlay"></div>
      <div class="destination-card__body">
        <span class="destination-card__region">Explore</span>
        <h3 class="destination-card__title">${escapeHTML(dest.title)}</h3>
        <p class="destination-card__desc">${escapeHTML(dest.blurb)}</p>
        <span class="destination-card__link">Browse Stays →</span>
      </div>
    </div>
  `;
}

export function renderDestinationGrid(destinations) {
  return `<div class="grid grid--4">${destinations.map(renderDestinationCard).join('')}</div>`;
}
