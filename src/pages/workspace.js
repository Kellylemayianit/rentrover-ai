/**
 * pages/workspace.js — the main app experience: three panes, always
 * visible side-by-side on desktop (tabs on mobile), inspired by
 * NotebookLM's Sources / Chat / Studio layout:
 *
 *   Stays  — search a place, browse results as cards
 *   Ask    — talk to RentRover in plain language; it searches the Stays pane for you
 *   Cart   — what you've picked, checkout via a real booking platform
 *            (in an in-app browser), and track the resulting orders
 *
 * No separate "blank canvas" screen — panes render immediately, like
 * NotebookLM does, and fill in as you use them.
 */

import { escapeHTML, formatPrice, $ } from '../utilities/helpers.js';
import { toast } from '../utilities/helpers.js';
import { ICONS } from '../utilities/icons.js';
import { loadSearch } from '../services/dataLoader.js';
import {
  addToCart, removeFromCart, isInCart,
  getCart, getCartCount, onChange as onCartChange,
} from '../services/cartStore.js';
import { createOrder, getOrders, onChange as onOrdersChange } from '../services/ordersStore.js';
import { registerProperties, getProperty } from '../services/propertyRegistry.js';
import { buildBookingMessage } from '../utilities/booking.js';
import { waLink, telegramLink, wechatContact, openExternal } from '../utilities/channelLinks.js';
import { CHECKOUT_PLATFORMS, buildCheckoutUrl } from '../utilities/platformLinks.js';
import { renderMapPanel } from '../components/mapPanel.js';
import { renderComparisonMatrix } from '../components/comparisonMatrix.js';
import { openModal, closeModal } from '../components/modal.js';
import { openInAppBrowser, closeInAppBrowser } from '../components/inAppBrowser.js';

const QUICK_REPLIES = [
  { label: '🏖️ Beach stays',        query: 'beach' },
  { label: '🏔️ Mountain retreats',  query: 'mountain hiking' },
  { label: '🏙️ City stays',         query: 'city apartment' },
  { label: '💰 Budget under $120',  query: 'budget' },
  { label: '🧭 Quiet cabin, Kyoto', query: 'quiet cabin near Kyoto, good for hiking' },
];

const FALLBACKS = [
  "No exact match — try a place name, a type of stay (\"cabin\", \"villa\"), or a vibe (\"romantic\", \"budget\").",
  "Nothing there yet. Try a country, city, or a word like *beach*, *mountain*, or *city*.",
  "Let's narrow it down — a region, a property type, or your budget all help.",
];
let fallbackIndex = 0;

// ── Page-local state ──────────────────────────────────────────
let messagesEl, chatInputEl;
let currentResults = [];
let compareIds = [];

export function renderWorkspacePage(root) {
  currentResults = [];
  compareIds = [];

  root.innerHTML = `
    <div class="app-shell" data-component="workspace-page">
      <header class="chat-header">
        <a href="#/" class="chat-header__back" aria-label="Back to home">${ICONS.chevronLeft}</a>
        <div class="chat-header__avatar" aria-hidden="true">🧭</div>
        <div class="chat-header__info">
          <div class="chat-header__name">RentRover AI</div>
          <div class="chat-header__status">Searching worldwide</div>
        </div>
        <button class="cart-badge" id="cart-badge" data-action="open-cart-pane" aria-label="View cart">
          ${ICONS.bag}<span>Cart</span><span class="cart-badge__count" id="cart-count">${getCartCount()}</span>
        </button>
      </header>

      <div class="workspace-tabs">
        <button class="workspace-tab" data-action="switch-pane" data-pane="stays">Stays</button>
        <button class="workspace-tab" data-action="switch-pane" data-pane="ask" data-active="true">Ask</button>
        <button class="workspace-tab" data-action="switch-pane" data-pane="cart">Cart <span id="mobile-cart-count">${getCartCount() ? `(${getCartCount()})` : ''}</span></button>
      </div>

      <div class="app-panes" id="app-panes" data-pane="ask">
        <section class="pane pane--stays" id="pane-stays">
          <header class="pane__header">
            <span>🔍 Stays</span>
            <button class="btn btn--sm btn--outline" data-action="view-map">Map</button>
          </header>
          <form class="pane-search" id="stays-search-form">
            <input class="pane-search__input" id="stays-search-input" type="text" placeholder="Search a place, a vibe…" autocomplete="off">
            <button type="submit" class="btn btn--sm btn--dark">Go</button>
          </form>
          <div class="pane__body" id="stays-results">
            <p class="text-muted text-center" style="padding:2rem 1rem;">Ask below, or search here, and stays will show up in this column.</p>
          </div>
          <button class="compare-fab" id="compare-fab" data-action="open-comparison" hidden>Compare 2 stays →</button>
        </section>

        <section class="pane pane--ask" id="pane-ask">
          <header class="pane__header"><span>💬 Ask RentRover</span></header>
          <div class="chat-messages" id="chat-messages"></div>
          <form class="chat-footer" id="chat-input-form">
            <div class="chat-input-row">
              <textarea class="chat-input" id="chat-input" rows="1" placeholder="Tell me where, or what kind of place…" autocomplete="off"></textarea>
              <button type="submit" class="chat-send-btn" aria-label="Send">${ICONS.send}</button>
            </div>
          </form>
        </section>

        <section class="pane pane--cart" id="pane-cart">
          <header class="pane__header"><span>🧳 Your Cart</span></header>
          <div class="pane__body" id="cart-body"></div>
        </section>
      </div>
    </div>
  `;

  messagesEl = $('#chat-messages', root);
  chatInputEl = $('#chat-input', root);

  onCartChange(() => {
    const count = getCartCount();
    const badge = $('#cart-count'); if (badge) badge.textContent = count;
    const mobileCount = $('#mobile-cart-count'); if (mobileCount) mobileCount.textContent = count ? `(${count})` : '';
    renderCartBody();
    refreshStaysAddButtons();
  });
  onOrdersChange(renderCartBody);

  $('#stays-search-form', root).addEventListener('submit', e => {
    e.preventDefault();
    const q = $('#stays-search-input', root).value.trim();
    handleQuery(q);
  });

  $('#chat-input-form', root).addEventListener('submit', e => {
    e.preventDefault();
    submitChatInput();
  });
  chatInputEl.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitChatInput(); }
  });
  chatInputEl.addEventListener('input', () => {
    chatInputEl.style.height = 'auto';
    chatInputEl.style.height = Math.min(chatInputEl.scrollHeight, 120) + 'px';
  });

  playGreeting();
  renderCartBody();

  // Deep-link support: #/app?q=beach%20villa or #/app?pane=cart (also accepts the old #/chat path)
  const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const deepQ = params.get('q');
  const deepPane = params.get('pane');
  if (deepQ) handleQuery(deepQ);
  if (deepPane) switchPane(deepPane);
}

// ── Ask pane: greeting + chat log ───────────────────────────────

function playGreeting() {
  appendBotMessage(
    "Hey — tell me where you're picturing, or what kind of place, and I'll line up real stays in the column on the left.",
    { quickReplies: QUICK_REPLIES }
  );
}

function renderMarkdown(text) {
  return escapeHTML(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

function appendBotMessage(text, { quickReplies = null } = {}) {
  const div = document.createElement('div');
  div.className = 'msg msg--bot';
  div.innerHTML = renderMarkdown(text) + (quickReplies ? renderQuickReplies(quickReplies) : '');
  messagesEl.appendChild(div);
  scrollToBottom();
}

function appendUserMessage(text) {
  const div = document.createElement('div');
  div.className = 'msg msg--user';
  div.textContent = text || '(browsing suggestions)';
  messagesEl.appendChild(div);
  scrollToBottom();
}

function renderQuickReplies(replies) {
  return `<div class="suggestion-chips">${replies.map(r =>
    `<button type="button" class="suggestion-chip" data-action="quick-reply" data-query="${escapeHTML(r.query)}">${r.label}</button>`
  ).join('')}</div>`;
}

function showTyping() {
  const div = document.createElement('div');
  div.className = 'msg msg--bot msg--typing';
  div.id = 'typing-indicator';
  div.innerHTML = '<span></span><span></span><span></span>';
  messagesEl.appendChild(div);
  scrollToBottom();
}
function hideTyping() { $('#typing-indicator')?.remove(); }
function scrollToBottom() { if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight; }
function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

export function submitChatInput() {
  const text = chatInputEl.value.trim();
  if (!text) return;
  chatInputEl.value = '';
  chatInputEl.style.height = 'auto';
  handleQuery(text, { fromChat: true });
}

/** Shared by both the Stays search box and the Ask input. */
export async function handleQuery(query, { fromChat = false } = {}) {
  if (fromChat) appendUserMessage(query);
  showTyping();
  switchPane('stays'); // on mobile, jump to results as soon as a search fires

  let results;
  try {
    results = await loadSearch(query);
    await wait(300);
  } catch (err) {
    hideTyping();
    appendBotMessage("I can't reach the search service right now — the backend may be offline. Try again in a moment.");
    return;
  }
  hideTyping();

  currentResults = results;
  registerProperties(results);
  renderStaysResults(results);

  if (!results.length) {
    appendBotMessage(FALLBACKS[fallbackIndex % FALLBACKS.length]);
    fallbackIndex++;
    return;
  }

  const names = results.slice(0, 3).map(p => p.name).join(', ');
  appendBotMessage(query
    ? `Found **${results.length}** ${results.length === 1 ? 'stay' : 'stays'} for "${query}" — ${names}${results.length > 3 ? ', and more' : ''}. Check the Stays column.`
    : `Here's a spread of stays to start with — see the Stays column.`);
}

// ── Stays pane ───────────────────────────────────────────────

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
    <div class="msg-property" data-property-id="${p.id}">
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

/** Pin clicks in the map modal: close it and scroll/highlight the matching card in the Stays pane. */
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

export function handleViewMap() {
  openModal({
    title: 'Map view',
    bodyHTML: `<div class="map-panel map-panel--modal">${renderMapPanel(currentResults)}</div>`,
  });
}

// ── Compare (modal, reusing comparisonMatrix.js) ────────────────

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

// ── Cart pane ────────────────────────────────────────────────

function renderCartBody() {
  const el = $('#cart-body');
  if (!el) return;
  const items = getCart();
  const orders = getOrders();

  el.innerHTML = `
    ${items.length ? renderCartItems(items) : renderCartEmpty()}

    ${items.length ? `
      <div class="cart-section">
        <div class="cart-section__title">Talk to our team</div>
        <p class="text-muted body-sm" style="margin-bottom:.75rem;">Send your picks straight to a person — we'll help you lock it in.</p>
        <div class="channel-buttons">
          <button class="btn btn--sm btn--outline" data-action="contact-channel" data-channel="whatsapp">💬 WhatsApp</button>
          <button class="btn btn--sm btn--outline" data-action="contact-channel" data-channel="telegram">✈️ Telegram</button>
          <button class="btn btn--sm btn--outline" data-action="contact-channel" data-channel="wechat">🟢 WeChat</button>
        </div>
        <div id="wechat-reveal"></div>
      </div>
    ` : ''}

    <div class="cart-section">
      <div class="cart-section__title">Your orders</div>
      ${orders.length ? renderOrders(orders) : `<p class="text-muted body-sm">Nothing yet — book a stay through one of the platforms above and it'll show up here.</p>`}
    </div>
  `;
}

function renderCartEmpty() {
  return `<div class="cart-empty" style="padding:2rem 1rem;"><div class="cart-empty__icon">🧳</div>Nothing in your cart yet — add stays from the Stays column.</div>`;
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
    <div class="order-card">
      <div class="order-card__top">
        <span class="order-card__platform">${escapeHTML(o.platform)}</span>
        <span class="badge ${ORDER_STATUS_BADGE[o.status] || 'badge--neutral'}">${escapeHTML(o.status)}</span>
      </div>
      <div class="order-card__items text-muted body-sm">
        ${o.items.map(i => escapeHTML(i.name)).join(', ')}
      </div>
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
  toast(`Opened ${platform} — we've logged this as a new order below.`, { type: 'success' });
}

export function handleContactChannel(channel) {
  const items = getCart();
  if (!items.length) return;
  const checkIn = $('#date-checkin')?.value || '';
  const checkOut = $('#date-checkout')?.value || '';
  const message = buildBookingMessage(items, { checkIn, checkOut });

  if (channel === 'whatsapp') openExternal(waLink(message));
  else if (channel === 'telegram') openExternal(telegramLink(message));
  else if (channel === 'wechat') {
    const { id, note } = wechatContact();
    const reveal = $('#wechat-reveal');
    if (reveal) reveal.innerHTML = `<p class="text-muted body-sm" style="margin-top:.5rem;">WeChat ID: <strong>${escapeHTML(id)}</strong> — ${escapeHTML(note)}</p>`;
  }
}

// ── Mobile tab switching ──────────────────────────────────────

export function switchPane(pane) {
  const panes = $('#app-panes');
  if (panes) panes.dataset.pane = pane;
  document.querySelectorAll('.workspace-tab').forEach(tab => {
    tab.dataset.active = String(tab.dataset.pane === pane);
  });
}

// ── Re-exports used by app.js's delegated handlers ─────────────

export { closeInAppBrowser };
export function closeCartModal() { closeModal(); }
