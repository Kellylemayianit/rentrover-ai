/**
 * pages/dashboard.js — admin dashboard shell + its three sub-views
 * (overview / properties / bookings). Guarded by requireAuth().
 */

import { requireAuth } from '../utilities/auth.js';
import { renderSidebar, renderBottomNav } from '../components/admin/sidebar.js';
import { renderStatCards } from '../components/admin/statCards.js';
import { renderPropertiesTable, renderBookingsTable } from '../components/admin/propertyTable.js';
import { renderPropertyForm } from '../components/admin/propertyForm.js';
import { openModal, closeModal } from '../components/modal.js';
import { loadProperties, loadBookings, loadDashboardStats, saveProperty, removeProperty } from '../services/dataLoader.js';
import { $, toast } from '../utilities/helpers.js';

/**
 * @param {HTMLElement} root
 * @param {'overview'|'properties'|'bookings'} view
 */
export async function renderDashboardPage(root, view = 'overview') {
  if (!requireAuth()) return;

  root.innerHTML = `
    <div class="admin-shell" data-component="dashboard">
      ${renderSidebar(view)}
      <div class="admin-main">
        <header class="admin-topbar">
          <h1 class="admin-topbar__title display-md">${titleFor(view)}</h1>
          ${view === 'properties' ? `<button class="btn btn--primary btn--sm" data-action="new-property">+ Add property</button>` : ''}
        </header>
        <div class="admin-content" id="admin-content">
          <p class="text-muted">Loading…</p>
        </div>
      </div>
      ${renderBottomNav(view)}
    </div>
  `;

  const content = $('#admin-content', root);

  try {
    if (view === 'overview') {
      const stats = await loadDashboardStats();
      content.innerHTML = renderStatCards(stats) + `
        <div class="admin-panel">
          <div class="admin-panel__header"><h3 class="admin-panel__title">Recent bookings</h3></div>
          <div id="overview-bookings-table"></div>
        </div>
      `;
      const [bookings, properties] = await Promise.all([loadBookings(), loadProperties()]);
      const byId = Object.fromEntries(properties.map(p => [p.id, p]));
      $('#overview-bookings-table', root).innerHTML = renderBookingsTable(bookings.slice(0, 5), byId);
    }

    if (view === 'properties') {
      const properties = await loadProperties();
      content.innerHTML = `<div class="admin-panel">${renderPropertiesTable(properties)}</div>`;
    }

    if (view === 'bookings') {
      const [bookings, properties] = await Promise.all([loadBookings(), loadProperties()]);
      const byId = Object.fromEntries(properties.map(p => [p.id, p]));
      content.innerHTML = `<div class="admin-panel">${renderBookingsTable(bookings, byId)}</div>`;
    }
  } catch (err) {
    content.innerHTML = `<p class="text-muted" style="padding:2rem;text-align:center;">Couldn't reach the backend for this view yet — some admin routes (${err.message}) aren't live.</p>`;
  }
}

function titleFor(view) {
  return { overview: 'Overview', properties: 'Properties', bookings: 'Bookings' }[view] || 'Dashboard';
}

// ── Admin actions (called from app.js delegated handlers) ────

export async function openNewPropertyModal() {
  openModal({ title: 'Add property', bodyHTML: renderPropertyForm() });
}

export async function openEditPropertyModal(propertyId) {
  try {
    const properties = await loadProperties();
    const property = properties.find(p => p.id === propertyId);
    if (!property) return;
    openModal({ title: 'Edit property', bodyHTML: renderPropertyForm(property) });
  } catch (err) {
    toast(`Couldn't load that property.`, { type: 'error' });
  }
}

/** Persists via api.js (createProperty/updateProperty) — see api.js for endpoint status. */
export async function handlePropertyFormSubmit(formEl) {
  const data = Object.fromEntries(new FormData(formEl).entries());
  const submitBtn = formEl.querySelector('button[type="submit"]');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Saving…'; }
  try {
    await saveProperty(data);
    closeModal();
    toast(`Saved "${data.name}".`, { type: 'success' });
  } catch (err) {
    toast(`Couldn't save — the properties API isn't reachable yet.`, { type: 'error' });
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = data.id ? 'Save changes' : 'Add property'; }
  }
}

/** Persists via api.js (deleteProperty) — see api.js for endpoint status. */
export async function handleDeleteProperty(propertyId) {
  try {
    await removeProperty(propertyId);
    toast('Listing removed.', { type: 'success' });
    await renderDashboardPage($('#app-root') || document.body, 'properties');
  } catch (err) {
    toast(`Couldn't delete — the properties API isn't reachable yet.`, { type: 'error' });
  }
}
