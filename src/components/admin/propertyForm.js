/**
 * admin/propertyForm.js — add/edit property form, rendered inside the
 * shared modal (see components/modal.js). Submission is wired in
 * pages/dashboard.js via a data-action="submit-property-form" handler.
 */

import { escapeHTML } from '../../utilities/helpers.js';

/** @param {Object} [property] — existing property to prefill, or omit for "add new" */
export function renderPropertyForm(property = {}) {
  const {
    id = '', name = '', type = 'Hotel', city = '', country = '', region = 'Africa',
    pricePerNight = '', currency = 'USD', description = '', image = '',
  } = property;

  const regionOptions = ['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania']
    .map(r => `<option value="${r}" ${r === region ? 'selected' : ''}>${r}</option>`).join('');

  const typeOptions = ['Hotel', 'Lodge', 'Villa', 'Apartment', 'Cabin', 'Riad', 'Guesthouse', 'Cottage', 'Resort']
    .map(t => `<option value="${t}" ${t === type ? 'selected' : ''}>${t}</option>`).join('');

  return `
    <form data-action="submit-property-form" data-property-id="${id}">
      <div class="form-grid">
        <div class="form-field form-field--full">
          <label for="pf-name">Property name</label>
          <input id="pf-name" name="name" required value="${escapeHTML(name)}">
        </div>
        <div class="form-field">
          <label for="pf-type">Type</label>
          <select id="pf-type" name="type">${typeOptions}</select>
        </div>
        <div class="form-field">
          <label for="pf-region">Region</label>
          <select id="pf-region" name="region">${regionOptions}</select>
        </div>
        <div class="form-field">
          <label for="pf-city">City</label>
          <input id="pf-city" name="city" required value="${escapeHTML(city)}">
        </div>
        <div class="form-field">
          <label for="pf-country">Country</label>
          <input id="pf-country" name="country" required value="${escapeHTML(country)}">
        </div>
        <div class="form-field">
          <label for="pf-price">Price / night</label>
          <input id="pf-price" name="pricePerNight" type="number" min="0" required value="${pricePerNight}">
        </div>
        <div class="form-field">
          <label for="pf-currency">Currency</label>
          <input id="pf-currency" name="currency" value="${escapeHTML(currency)}">
        </div>
        <div class="form-field form-field--full">
          <label for="pf-image">Image URL</label>
          <input id="pf-image" name="image" value="${escapeHTML(image)}">
        </div>
        <div class="form-field form-field--full">
          <label for="pf-description">Description</label>
          <textarea id="pf-description" name="description">${escapeHTML(description)}</textarea>
        </div>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn--outline" data-action="close-modal">Cancel</button>
        <button type="submit" class="btn btn--primary">${id ? 'Save changes' : 'Add property'}</button>
      </div>
    </form>
  `;
}
