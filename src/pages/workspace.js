/**
 * pages/workspace.js — the entire app. Three panes, always visible
 * side-by-side on desktop, switchable via a bottom nav bar on mobile
 * (NotebookLM's Sources/Chat/Studio pattern):
 *
 *   Stays — search a place or requirement, browse results as cards
 *   Ask   — answers questions grounded in whatever Stays currently has
 *           loaded (see utilities/askEngine.js) — it does not run new
 *           searches itself, that's Stays' job
 *   Cart  — your picks, checkout via a real booking platform (in an
 *           in-app browser), and your booking history — tied to your
 *           account once you sign in (top bar), so it survives a refresh
 *
 * There is no other page in this app.
 */

import { escapeHTML, formatPrice, $, toast } from '../utilities/helpers.js';
import { ICONS } from '../utilities/icons.js';
import { loadProperties, loadSearch } from '../services/dataLoader.js';
import {
  addToCart, removeFromCart, isInCart,
  getCart, getCartCount, onChange as onCartChange,
} from '../services/cartStore.js';
import { createOrder, getOrders, claimGuestOrders, onChange as onOrdersChange } from '../services/ordersStore.js';
import { signUp, login, logout, currentUser, isLoggedIn, onChange as onAuthChange } from '../services/authStore.js';
import { getTheme, toggleTheme } from '../services/themeStore.js';
import { buildBookingMessage } from '../utilities/booking.js';
import { waLink, telegramLink, wechatContact, openExternal } from '../utilities/channelLinks.js';
import { CHECKOUT_PLATFORMS, buildCheckoutUrl } from '../utilities/platformLinks.js';
import { answerQuestion } from '../utilities/askEngine.js';
import { registerProperties, getProperty } from '../services/propertyRegistry.js';
import { renderMapPanel } from '../components/mapPanel.js';
import { renderComparisonMatrix } from '../components/comparisonMatrix.js';
import { openModal, closeModal } from '../components/modal.js';
import { openInAppBrowser, closeInAppBrowser } from '../components/inAppBrowser.js';

const STAYS_SUGGESTIONS = [
  { label: '🏖️ Beach', query: 'beach' },
  { label: '🏔️ Mountains', query: 'mountain hiking' },
  { label: '🏙️ City', query: 'city apartment' },
  { label: '🌿 Nature', query: 'nature wellness' },
];

const ASK_SUGGESTIONS = [
  { label: 'Which is cheapest?', query: 'which is the cheapest' },
  { label: 'Best rated?', query: 'what is the best rated' },
  { label: 'Any with a pool?', query: 'pool' },
  { label: 'How many stays?', query: 'how many stays are there' },
];

// ── Page-local state ──────────────────────────────────────────
let messagesEl, askInputEl;
let currentResults = [];
let compareIds = [];
let authMode = 'login'; // 'login' | 'signup' — which form the auth modal shows

export function renderWorkspacePage(root) {
  currentResults = [];
  compareIds = [];

  root.innerHTML = `
    <div class="app-shell" data-component="workspace-page">
      <header class="top-bar">
        <button class="top-bar__account" id="account-btn" data-action="open-account"></button>
        <div class="top-bar__brand"><span class="top-bar__mark">🧭</span> RentRover AI</div>
        <button class="top-bar__theme" id="theme-btn" data-action="toggle-theme" aria-label="Toggle dark mode"></button>
      </header>

      <div class="app-panes" id="app-panes" data-pane="stays">
        <section class="pane pane--stays glass" id="pane-stays">
          <header class="pane__header">
            <span></span>
            <h2>📍 Stays</h2>
            <button class="btn btn--sm btn--outline" data-action="view-map">Map</button>
          </header>
          <form class="pane-search" id="stays-search-form">
            <input class="pane-search__input" id="stays-search-input" type="text" placeholder="Where to? A place, a vibe, a budget…" autocomplete="off">
            <button type="submit" class="btn btn--sm btn--dark">Go</button>
          </form>
          <div class="suggestion-chips suggestion-chips--pane">${renderChips(STAYS_SUGGESTIONS, 'quick-search')}</div>
          <div class="pane__body" id="stays-results">
            <p class="text-muted text-center" style="padding:2rem 1rem;">Loading stays…</p>
          </div>
          <button class="compare-fab" id="compare-fab" data-action="open-comparison" hidden>Compare 2 stays →</button>
        </section>

        <section class="pane pane--ask glass" id="pane-ask">
          <header class="pane__header"><span></span><h2>💬 Ask</h2><span></span></header>
          <div class="chat-messages" id="chat-messages"></div>
          <form class="chat-footer" id="ask-form">
            <div class="chat-input-row">
              <textarea class="chat-input" id="ask-input" rows="1" placeholder="Ask about what's listed in Stays…" autocomplete="off"></textarea>
              <button type="submit" class="chat-send-btn" aria-label="Send">${ICONS.send}</button>
            </div>
          </form>
        </section>

        <section class="pane pane--cart glass" id="pane-cart">
          <header class="pane__header"><span></span><h2>🧳 Cart</h2><span></span></header>
          <div class="pane__body" id="cart-body"></div>
        </section>
      </div>

      <nav class="bottom-nav glass" id="bottom-nav">
        <button class="bottom-nav__btn" data-action="switch-pane" data-pane="stays" data-active="true">
          ${ICONS.bed}<span>Stays</span>
        </button>
        <button class="bottom-nav__btn" data-action="switch-pane" data-pane="ask">
          ${ICONS.chat}<span>Ask</span>
        </button>
        <button class="bottom-nav__btn" data-action="switch-pane" data-pane="cart">
          ${ICONS.bag}<span>Cart</span>
          <span class="bottom-nav__badge" id="bottom-nav-cart-badge" ${getCartCount() ? '' : 'hidden'}>${getCartCount()}</span>
        </button>
      </nav>
    </div>
  `;

  messagesEl = $('#chat-messages', root);
  askInputEl = $('#ask-input', root);

  renderThemeButton();
  renderAccountButton();

  onCartChange(() => {
    const badge = $('#bottom-nav-cart-badge');
    if (badge) { badge.textContent = getCartCount(); badge.hidden = getCartCount() === 0; }
    renderCartBody();
    refreshStaysAddButtons();
  });
  onOrdersChange(renderCartBody);
  onAuthChange(() => { renderAccountButton(); renderCartBody(); });

  $('#stays-search-form', root).addEventListener('submit', e => {
    e.preventDefault();
    handleStaysSearch($('#stays-search-input', root).value.trim());
  });

  $('#ask-form', root).addEventListener('submit', e => {
    e.preventDefault();
    submitAskInput();
  });
  askInputEl.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitAskInput(); }
  });
  askInputEl.addEventListener('input', () => {
    askInputEl.style.height = 'auto';
    askInputEl.style.height = Math.min(askInputEl.scrollHeight, 120) + 'px';
  });

  playGreeting();
  renderCartBody();
  loadInitialStays();

  // Deep-link support via plain query string — there's no hash routing
  // anymore since this is the only page.
  const params = new URLSearchParams(window.location.search);
  const deepQ = params.get('q');
  const deepPane = params.get('pane');
  if (deepQ) handleStaysSearch(deepQ);
  if (deepPane) switchPane(deepPane);
}

async function loadInitialStays() {
  try {
    const properties = await loadProperties();
    currentResults = properties;
    registerProperties(properties);
    renderStaysResults(properties);
  } catch (err) {
    const grid = $('#stays-results');
    if (grid) grid.innerHTML = `<p class="text-muted text-center" style="padding:2rem 1rem;">Can't reach the search backend right now — try again shortly.</p>`;
  }
}

// ── Top bar: theme + account ────────────────────────────────

function renderThemeButton() {
  const btn = $('#theme-btn');
  if (!btn) return;
  btn.innerHTML = getTheme() === 'dark' ? ICONS.sun : ICONS.moon;
}

export function handleToggleTheme() {
  toggleTheme();
  renderThemeButton();
}

function renderAccountButton() {
  const btn = $('#account-btn');
  if (!btn) return;
  const user = currentUser();
  if (user) {
    const initial = (user.name || user.email || '?').trim().charAt(0).toUpperCase();
    btn.innerHTML = `<span class="top-bar__avatar">${initial}</span>`;
  } else {
    btn.innerHTML = `${ICONS.user}<span class="top-bar__account-label">Sign in</span>`;
  }
}

export function handleOpenAccount() {
  const user = currentUser();
  if (user) {
    openModal({
      title: 'Your account',
      bodyHTML: `
        <p class="text-center" style="margin-bottom:1rem;">
          Signed in as <strong>${escapeHTML(user.name || user.email)}</strong><br>
          <span class="text-muted body-sm">${escapeHTML(user.email)}</span>
        </p>
        <button class="btn btn--outline btn--block" data-action="do-logout">Log out</button>
      `,
    });
  } else {
    authMode = 'login';
    openModal({ title: 'Welcome back', bodyHTML: renderAuthForm() });
  }
}

export function handleLogout() {
  logout();
  closeModal();
  toast('Signed out.', { type: 'success' });
}

export function handleToggleAuthMode() {
  authMode = authMode === 'login' ? 'signup' : 'login';
  openModal({ title: authMode === 'login' ? 'Welcome back' : 'Create your account', bodyHTML: renderAuthForm() });
}

function renderAuthForm() {
  const isSignup = authMode === 'signup';
  return `
    <form id="auth-form" data-mode="${authMode}">
      <p class="subheading body-sm" style="margin-bottom:1.25rem;">
        ${isSignup ? 'Save your cart and track bookings across visits.' : "We'll pull up your saved cart and bookings."}
      </p>
      ${isSignup ? `
        <div class="form-field">
          <label for="auth-name">Name</label>
          <input id="auth-name" name="name" required autocomplete="name">
        </div>
      ` : ''}
      <div class="form-field">
        <label for="auth-email">Email</label>
        <input id="auth-email" name="email" type="email" required autocomplete="email">
      </div>
      <div class="form-field">
        <label for="auth-password">Password</label>
        <input id="auth-password" name="password" type="password" required minlength="6" autocomplete="${isSignup ? 'new-password' : 'current-password'}">
      </div>
      <button type="submit" class="btn btn--primary btn--block" style="margin-top:.5rem;">${isSignup ? 'Create account' : 'Sign in'}</button>
      <p class="text-center body-sm text-muted" style="margin-top:1rem;">
        ${isSignup ? 'Already have an account?' : "Don't have an account?"}
        <button type="button" class="link-btn" data-action="toggle-auth-mode">${isSignup ? 'Sign in' : 'Sign up'}</button>
      </p>
    </form>
  `;
}

export async function handleAuthSubmit(formEl) {
  const data = Object.fromEntries(new FormData(formEl).entries());
  const submitBtn = formEl.querySelector('button[type="submit"]');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Please wait…'; }

  const result = formEl.dataset.mode === 'signup' ? await signUp(data) : await login(data);

  if (!result.ok) {
    toast(result.error || 'Something went wrong.', { type: 'error' });
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = formEl.dataset.mode === 'signup' ? 'Create account' : 'Sign in'; }
    return;
  }

  claimGuestOrders();
  closeModal();
  toast(`Signed in as ${result.user.name || result.user.email}.`, { type: 'success' });
}

// ── Stays pane: the only thing that searches ────────────────────

export async function handleStaysSearch(query) {
  const grid = $('#stays-results');
  if (grid) grid.innerHTML = `<p class="text-muted text-center" style="padding:2rem 1rem;">Searching…</p>`;
  switchPane('stays');

  let results;
  try {
    results = await loadSearch(query);
  } catch (err) {
    if (grid) grid.innerHTML = `<p class="text-muted text-center" style="padding:2rem 1rem;">Can't reach the search backend right now — try again shortly.</p>`;
    return;
  }

  currentResults = results;
  registerProperties(results);
  renderStaysResults(results);
}

function renderStaysResults(properties) {
  const grid = $('#stays-results');
  if (!grid) return;
  if (!properties.length) {
    grid.innerHTML = `<p class="text-muted text-center" style="padding:2rem 1rem;">No matches — try different words.</p>`;
    return;
  }
  grid.innerHTML = properties.map(renderStayCard).join('');
}

function renderStayCard(p) {
  const added = isInCart(p.id);
  const comparing = compareIds.includes(p.id);
  const sourcesHTML = (p.sources || []).map(s =>
    `<span class="msg-property__source-chip">${escapeHTML(s.platform)} ${formatPrice(s.price, p.currency)}</span>`
  ).join('');

  return `
    <div class="msg-property glass" data-property-id="${p.id}">
      <img class="msg-property__img" src="${p.image}" alt="" loading="lazy">
      <div class="msg-property__body">
        <div class="msg-property__name">${escapeHTML(p.name)}</div>
        <div class="msg-property__meta">📍 ${escapeHTML(p.city)}, ${escapeHTML(p.country)} · ${escapeHTML(p.type)}</div>
        <div class="msg-property__price">${formatPrice(p.pricePerNight, p.currency)}/night</div>
        <div class="msg-property__sources">${sourcesHTML}</div>
      </div>
      <div class="msg-property__actions">
        <button class="btn btn--sm ${added ? 'btn--dark' : 'btn--primary'}"
          data-action="add-to-cart" data-property-id="${p.id}" data-added="${added}">
          ${added ? '✓ In cart' : '+ Add to cart'}
        </button>
        <button class="btn btn--sm btn--outline"
          data-action="toggle-compare" data-property-id="${p.id}" data-active="${comparing}">
          ${comparing ? '✓ Comparing' : '⇄ Compare'}
        </button>
      </div>
    </div>
  `;
}

function refreshStaysAddButtons() {
  document.querySelectorAll('.msg-property[data-property-id]').forEach(card => {
    const id = card.dataset.propertyId;
    const btn = card.querySelector('[data-action="add-to-cart"]');
    if (!btn) return;
    const added = isInCart(id);
    btn.dataset.added = String(added);
    btn.textContent = added ? '✓ In cart' : '+ Add to cart';
    btn.classList.toggle('btn--dark', added);
    btn.classList.toggle('btn--primary', !added);
  });
}

export function handleAddToCart(propertyId) {
  const prop = getProperty(propertyId);
  if (!prop) return;
  addToCart(prop);
}

export function handleViewMap() {
  openModal({ title: 'Map view', bodyHTML: `<div class="map-panel map-panel--modal">${renderMapPanel(currentResults)}</div>` });
}

export function handleFocusProperty(propertyId) {
  closeModal();
  switchPane('stays');
  const card = document.querySelector(`.msg-property[data-property-id="${propertyId}"]`);
  if (!card) return;
  document.querySelectorAll('.msg-property.is-focused').forEach(el => el.classList.remove('is-focused'));
  card.classList.add('is-focused');
  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => card.classList.remove('is-focused'), 1800);
}

// ── Compare (modal) ──────────────────────────────────────────

export function handleToggleCompare(propertyId) {
  const idx = compareIds.indexOf(propertyId);
  if (idx >= 0) compareIds.splice(idx, 1);
  else {
    if (compareIds.length >= 2) compareIds.shift();
    compareIds.push(propertyId);
  }
  document.querySelectorAll(`[data-property-id="${propertyId}"][data-action="toggle-compare"]`).forEach(btn => {
    const active = compareIds.includes(propertyId);
    btn.dataset.active = String(active);
    btn.textContent = active ? '✓ Comparing' : '⇄ Compare';
  });
  const fab = $('#compare-fab');
  if (fab) { fab.hidden = compareIds.length < 2; fab.textContent = `Compare ${compareIds.length} stays →`; }
}

export function openComparisonView() {
  if (compareIds.length < 2) return;
  const properties = compareIds.map(id => getProperty(id)).filter(Boolean);
  if (properties.length < 2) return;
  openModal({
    title: `Comparing ${properties.length} stays`,
    bodyHTML: `<div class="comparison-body comparison-body--modal">${renderComparisonMatrix(properties)}</div>`,
  });
}

// ── Ask pane: grounded Q&A over Stays, no network call ──────────

function playGreeting() {
  appendBotMessage(
    "Ask me about what's listed in Stays — price, ratings, amenities, or a specific place by name.",
    { chips: ASK_SUGGESTIONS, chipAction: 'ask-suggestion' }
  );
}

function renderMarkdown(text) {
  return escapeHTML(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

function appendBotMessage(text, { chips = null, chipAction = 'ask-suggestion', highlightIds = [] } = {}) {
  const div = document.createElement('div');
  div.className = 'msg msg--bot glass';
  let html = renderMarkdown(text);
  if (highlightIds.length) {
    html += `<div class="suggestion-chips" style="margin-top:.6rem;">
      <button type="button" class="suggestion-chip" data-action="focus-property" data-property-id="${highlightIds[0]}">👀 View in Stays</button>
    </div>`;
  } else if (chips) {
    html += renderChips(chips, chipAction);
  }
  div.innerHTML = html;
  messagesEl.appendChild(div);
  scrollToBottom();
}

function appendUserMessage(text) {
  const div = document.createElement('div');
  div.className = 'msg msg--user';
  div.textContent = text;
  messagesEl.appendChild(div);
  scrollToBottom();
}

function renderChips(items, action) {
  return `<div class="suggestion-chips">${items.map(r =>
    `<button type="button" class="suggestion-chip" data-action="${action}" data-query="${escapeHTML(r.query)}">${r.label}</button>`
  ).join('')}</div>`;
}

function scrollToBottom() { if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight; }

export function submitAskInput() {
  const text = askInputEl.value.trim();
  if (!text) return;
  askInputEl.value = '';
  askInputEl.style.height = 'auto';
  handleAskQuestion(text);
}

export function handleAskQuestion(question) {
  appendUserMessage(question);
  const { text, highlightIds } = answerQuestion(question, currentResults);
  appendBotMessage(text, { highlightIds });
}

// ── Cart pane: cart + checkout + bookings ───────────────────────

function renderCartBody() {
  const el = $('#cart-body');
  if (!el) return;
  const items = getCart();
  const orders = getOrders();
  const user = currentUser();

  el.innerHTML = `
    <div class="cart-section" style="margin-top:0;padding-top:0;border-top:none;">
      ${user ? `
        <p class="text-center body-sm text-muted">Signed in as <strong>${escapeHTML(user.name || user.email)}</strong></p>
      ` : `
        <div class="signin-prompt">
          <p class="text-center body-sm" style="margin-bottom:.6rem;">Sign in to keep your cart and bookings across visits.</p>
          <button class="btn btn--sm btn--dark" data-action="open-account" style="margin:0 auto;display:block;">Sign in / Create account</button>
        </div>
      `}
    </div>

    <div class="cart-section">
      <h3>Cart</h3>
      ${items.length ? renderCartItems(items) : renderCartEmpty()}
    </div>

    ${items.length ? `
      <div class="cart-section">
        <h3>Talk to our team</h3>
        <p class="text-muted body-sm text-center" style="margin-bottom:.75rem;">Send your picks to a person — we'll help you lock it in.</p>
        <div class="channel-buttons">
          <button class="btn btn--sm btn--outline" data-action="contact-channel" data-channel="whatsapp">💬 WhatsApp</button>
          <button class="btn btn--sm btn--outline" data-action="contact-channel" data-channel="telegram">✈️ Telegram</button>
          <button class="btn btn--sm btn--outline" data-action="contact-channel" data-channel="wechat">🟢 WeChat</button>
        </div>
        <div id="wechat-reveal"></div>
      </div>
    ` : ''}

    <div class="cart-section">
      <h3>Your bookings</h3>
      ${orders.length ? renderOrders(orders) : `<p class="text-muted body-sm text-center">Nothing yet — check out through one of the platforms above and it'll show up here.</p>`}
    </div>
  `;
}

function renderCartEmpty() {
  return `<div class="cart-empty"><div class="cart-empty__icon">🧳</div>Nothing in your cart yet — add stays from the Stays column.</div>`;
}

function renderCartItems(items) {
  return `
    <div class="date-row">
      <div class="date-row__field">
        <label class="date-row__label" for="date-checkin">Check-in</label>
        <input class="date-row__input" type="date" id="date-checkin">
      </div>
      <div class="date-row__field">
        <label class="date-row__label" for="date-checkout">Check-out</label>
        <input class="date-row__input" type="date" id="date-checkout">
      </div>
    </div>
    ${items.map(item => `
      <div class="cart-item" data-item-id="${item.id}">
        <div class="cart-item__icon">${item.emoji}</div>
        <div class="cart-item__body">
          <div class="cart-item__name">${escapeHTML(item.name)}</div>
          <div class="cart-item__meta">${escapeHTML(item.location)} · ${escapeHTML(item.priceEstimate)}</div>
          <div class="platform-buttons">
            ${CHECKOUT_PLATFORMS.map(platform => `
              <button class="platform-btn" data-action="checkout-platform" data-property-id="${item.id}" data-platform="${platform}">${platform}</button>
            `).join('')}
          </div>
        </div>
        <button class="cart-item__remove" data-action="remove-from-cart" data-property-id="${item.id}">Remove</button>
      </div>
    `).join('')}
  `;
}

const ORDER_STATUS_BADGE = {
  'Requested': 'badge--warning',
  'Confirmed': 'badge--info',
  'Upcoming stay': 'badge--success',
  'Completed': 'badge--neutral',
};

function renderOrders(orders) {
  return orders.map(o => `
    <div class="order-card glass">
      <div class="order-card__top">
        <span class="order-card__platform">${escapeHTML(o.platform)}</span>
        <span class="badge ${ORDER_STATUS_BADGE[o.status] || 'badge--neutral'}">${escapeHTML(o.status)}</span>
      </div>
      <div class="order-card__items text-muted body-sm">${o.items.map(i => escapeHTML(i.name)).join(', ')}</div>
    </div>
  `).join('');
}

export function handleRemoveFromCart(propertyId) {
  removeFromCart(propertyId);
}

export function handleCheckoutPlatform(propertyId, platform) {
  const item = getCart().find(i => i.id === propertyId) || getProperty(propertyId);
  if (!item) return;
  const url = buildCheckoutUrl(platform, item);
  openInAppBrowser({ platform, url });
  createOrder({ items: [item], platform, checkIn: $('#date-checkin')?.value, checkOut: $('#date-checkout')?.value });
  toast(`Opened ${platform} — logged as a new booking below.`, { type: 'success' });
}

export function handleContactChannel(channel) {
  const items = getCart();
  if (!items.length) return;
  const user = currentUser();
  const checkIn = $('#date-checkin')?.value || '';
  const checkOut = $('#date-checkout')?.value || '';
  const message = buildBookingMessage(items, { checkIn, checkOut, guestName: user?.name });

  if (channel === 'whatsapp') openExternal(waLink(message));
  else if (channel === 'telegram') openExternal(telegramLink(message));
  else if (channel === 'wechat') {
    const { id, note } = wechatContact();
    const reveal = $('#wechat-reveal');
    if (reveal) reveal.innerHTML = `<p class="text-muted body-sm" style="margin-top:.5rem;">WeChat ID: <strong>${escapeHTML(id)}</strong> — ${escapeHTML(note)}</p>`;
  }
}

// ── Bottom nav (mobile pane switching) ───────────────────────

export function switchPane(pane) {
  const panes = $('#app-panes');
  if (panes) panes.dataset.pane = pane;
  document.querySelectorAll('.bottom-nav__btn').forEach(btn => {
    btn.dataset.active = String(btn.dataset.pane === pane);
  });
}

export { closeInAppBrowser };
