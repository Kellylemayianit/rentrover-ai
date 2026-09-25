/**
 * pages/chat.js — the concierge workspace. Three stages, one page:
 *   1. "blank"   — centered greeting + input, no map/chat log yet
 *   2. "split"   — map (left) + chat log with embedded property cards (right)
 *   3. "compare" — map + full comparison matrix + a docked chat column (right)
 * State lives in module-level variables (page-local, not persisted) —
 * itinerary state stays in services/cartStore.js as before.
 */

import { escapeHTML, formatPrice, $ } from '../utilities/helpers.js';
import { ICONS } from '../utilities/icons.js';
import { loadSearch } from '../services/dataLoader.js';
import {
  addToItinerary, removeFromItinerary, isInItinerary,
  getItinerary, getCartCount, onChange,
} from '../services/cartStore.js';
import { buildItineraryMessage } from '../utilities/booking.js';
import { waLink, openExternal } from '../utilities/channelLinks.js';
import { renderMapPanel } from '../components/mapPanel.js';
import { renderComparisonMatrix } from '../components/comparisonMatrix.js';

const QUICK_REPLIES = [
  { label: '🏖️ Beach stays',        query: 'beach' },
  { label: '🏔️ Mountain retreats',  query: 'mountain hiking' },
  { label: '🏙️ City stays',         query: 'city apartment' },
  { label: '💰 Budget under $120',  query: 'budget' },
  { label: '🌿 Nature & wellness',  query: 'nature wellness' },
  { label: '🧭 Quiet cabin, Kyoto', query: 'quiet cabin near Kyoto, good for hiking' },
];

const FALLBACKS = [
  "I didn't quite catch that — try a destination (\"Kyoto\", \"Morocco\"), a property type (\"villa\", \"cabin\"), or a vibe (\"romantic\", \"budget\").",
  "Hmm, no exact match. Try a country, city, or a word like *beach*, *mountain*, or *city*.",
  "Let's narrow it down — mention a region (Africa, Asia, Europe…), a type of stay, or your budget.",
];
let fallbackIndex = 0;

// ── Page-local state ──────────────────────────────────────────
let messagesEl, inputEl;
let currentResults = [];      // latest search results, feeds the map panel
let knownProperties = {};     // every property object seen this session, by id —
                               // lets "Compare" work on scrolled-back cards without
                               // needing a by-id endpoint the backend doesn't have yet
let compareIds = [];          // up to 2 property ids selected for comparison
let workspaceState = 'split'; // 'split' | 'compare' — only meaningful once workspace is shown
let mobilePanel = 'chat';     // 'map' | 'chat' | 'compare' — mobile tab state

export function renderChatPage(root) {
  currentResults = [];
  knownProperties = {};
  compareIds = [];
  workspaceState = 'split';
  mobilePanel = 'chat';

  root.innerHTML = `
    <div class="concierge-shell" data-component="chat-page">
      <header class="chat-header">
        <a href="#/" class="chat-header__back" aria-label="Back to home">${ICONS.chevronLeft}</a>
        <div class="chat-header__avatar" aria-hidden="true">🧭</div>
        <div class="chat-header__info">
          <div class="chat-header__name">RentRover Concierge</div>
          <div class="chat-header__status">Online — worldwide</div>
        </div>
        <button class="cart-badge" id="cart-badge" data-action="open-itinerary" aria-label="View itinerary">
          ${ICONS.bag}<span>Itinerary</span><span class="cart-badge__count" id="cart-count">${getCartCount()}</span>
        </button>
      </header>

      <div class="concierge-body">
        <!-- Stage 1: blank canvas -->
        <section class="concierge-welcome" id="concierge-welcome">
          <div class="concierge-welcome__mark">🧭</div>
          <h1 class="display-lg">Where can I take you?</h1>
          <p>Tell me a destination, a vibe, or what you're hoping to do — I'll pull real stays from across the web and lay them out on a map.</p>
          <form class="welcome-search" id="welcome-search-form">
            <input class="welcome-search__input" id="welcome-search-input" type="text"
              placeholder="e.g. “quiet cabin near Kyoto, good for hiking”" autocomplete="off">
            <button type="submit" class="btn btn--primary">Ask</button>
          </form>
          <div class="suggestion-chips">${renderQuickReplies(QUICK_REPLIES)}</div>
        </section>

        <!-- Stages 2 & 3: map + chat (+ comparison) workspace -->
        <div class="concierge-workspace" id="concierge-workspace" data-state="split" data-panel="chat" hidden>
          <div class="workspace-tabs">
            <button class="workspace-tab" data-action="switch-panel" data-panel="map">Map</button>
            <button class="workspace-tab" data-action="switch-panel" data-panel="chat" data-active="true">Chat</button>
            <button class="workspace-tab" data-action="switch-panel" data-panel="compare" id="compare-tab" hidden>Compare</button>
          </div>

          <aside class="map-panel" id="map-panel">${renderMapPanel([])}</aside>

          <div class="chat-column" id="chat-column">
            <div class="chat-messages" id="chat-messages"></div>
            <form class="chat-footer" id="chat-input-form">
              <div class="chat-input-row">
                <textarea class="chat-input" id="chat-input" rows="1" placeholder="Ask a follow-up…" autocomplete="off"></textarea>
                <button type="submit" class="chat-send-btn" aria-label="Send">${ICONS.send}</button>
              </div>
              <button type="button" class="whatsapp-cta" id="whatsapp-cta" data-action="open-itinerary" data-empty="${getCartCount() === 0}">
                ${ICONS.whatsapp}
                <span class="whatsapp-cta__text">Send Enquiry via WhatsApp</span>
                <span class="whatsapp-cta__count">${getCartCount()} stays</span>
              </button>
            </form>
          </div>

          <div class="comparison-column" id="comparison-column"></div>
        </div>

        <button class="compare-fab" id="compare-fab" data-action="open-comparison" hidden>Compare 2 stays →</button>
      </div>
    </div>

    ${renderItineraryDrawer()}
  `;

  messagesEl = $('#chat-messages', root);
  inputEl = $('#chat-input', root);

  onChange(() => {
    const count = getCartCount();
    const badge = $('#cart-count'); if (badge) badge.textContent = count;
    const wa = $('#whatsapp-cta'); if (wa) { wa.dataset.empty = String(count === 0); wa.querySelector('.whatsapp-cta__count').textContent = `${count} stays`; }
    refreshDrawerList();
  });

  $('#welcome-search-form', root).addEventListener('submit', e => {
    e.preventDefault();
    const q = $('#welcome-search-input', root).value.trim();
    enterWorkspace(q);
  });

  $('#chat-input-form', root).addEventListener('submit', e => {
    e.preventDefault();
    submitChatInput();
  });
  inputEl.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitChatInput(); }
  });
  inputEl.addEventListener('input', () => {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
  });

  // Deep-link support: #/chat?q=beach%20villa
  const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const deepQ = params.get('q');
  if (deepQ) enterWorkspace(deepQ);
}

// ── Stage transition: blank canvas → split workspace ──────────

function enterWorkspace(firstQuery) {
  $('#concierge-welcome').style.display = 'none';
  const ws = $('#concierge-workspace');
  ws.hidden = false;
  handleUserQuery(firstQuery);
}

// ── Message rendering ────────────────────────────────────────

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
function hideTyping() {
  $('#typing-indicator')?.remove();
}

function scrollToBottom() {
  if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── User input handling ─────────────────────────────────────

export function submitChatInput() {
  const text = inputEl.value.trim();
  if (!text) return;
  inputEl.value = '';
  inputEl.style.height = 'auto';
  handleUserQuery(text);
}

export async function handleUserQuery(query) {
  appendUserMessage(query);
  showTyping();

  let results;
  try {
    results = await loadSearch(query);
    await wait(300);
  } catch (err) {
    hideTyping();
    appendBotMessage("I can't reach the search service right now — the backend may be offline. Please try again in a moment.");
    return;
  }
  hideTyping();

  currentResults = results;
  updateMapPanel();

  if (!results.length) {
    appendBotMessage(FALLBACKS[fallbackIndex % FALLBACKS.length]);
    fallbackIndex++;
    return;
  }

  const top = results.slice(0, 4);
  const acknowledgement = query
    ? `Got it — here's what I found for **"${query}"**, pulled together from Airbnb, Booking.com, and nearby listings:`
    : `Here's a spread of stays to get you started:`;
  appendBotMessage(acknowledgement);
  appendPropertyResults(top);
}

function appendPropertyResults(properties) {
  properties.forEach(p => { knownProperties[p.id] = p; });

  const div = document.createElement('div');
  div.className = 'msg msg--bot';
  div.innerHTML = `<div class="msg__results">${properties.map(renderMsgProperty).join('')}</div>`;
  messagesEl.appendChild(div);
  scrollToBottom();
}

function renderMsgProperty(p) {
  const added = isInItinerary(p.id);
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
        <button class="btn btn--sm ${added ? 'btn--dark' : 'btn--primary'} msg-property__add"
          data-action="add-to-itinerary" data-property-id="${p.id}" data-added="${added}">
          ${added ? '✓ Added' : '+ Add'}
        </button>
        <button class="btn btn--sm btn--outline msg-property__compare"
          data-action="toggle-compare" data-property-id="${p.id}" data-active="${comparing}">
          ${comparing ? '✓ Comparing' : '⇄ Compare'}
        </button>
      </div>
    </div>
  `;
}

// ── Delegated actions called from app.js ─────────────────────

export function handleAddToItinerary(propertyId, propertiesLookup) {
  const prop = propertiesLookup[propertyId];
  if (!prop) return;
  const added = addToItinerary(prop);
  if (added) {
    document.querySelectorAll(`[data-property-id="${propertyId}"][data-action="add-to-itinerary"]`)
      .forEach(btn => { btn.dataset.added = 'true'; btn.textContent = '✓ Added'; btn.classList.add('btn--dark'); });
  }
}

export function handleFocusProperty(propertyId) {
  const card = document.querySelector(`.msg-property[data-property-id="${propertyId}"]`);
  if (!card) return;
  document.querySelectorAll('.msg-property.is-focused').forEach(el => el.classList.remove('is-focused'));
  card.classList.add('is-focused');
  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => card.classList.remove('is-focused'), 1800);
}

// ── Compare selection + comparison view ───────────────────────

export async function handleToggleCompare(propertyId) {
  const idx = compareIds.indexOf(propertyId);
  if (idx >= 0) {
    compareIds.splice(idx, 1);
  } else {
    if (compareIds.length >= 2) compareIds.shift(); // keep the two most recent picks
    compareIds.push(propertyId);
  }

  document.querySelectorAll(`[data-property-id="${propertyId}"][data-action="toggle-compare"]`)
    .forEach(btn => {
      const active = compareIds.includes(propertyId);
      btn.dataset.active = String(active);
      btn.textContent = active ? '✓ Comparing' : '⇄ Compare';
    });

  const fab = $('#compare-fab');
  if (fab) {
    fab.hidden = compareIds.length < 2;
    fab.textContent = `Compare ${compareIds.length} stays →`;
  }
}

export async function openComparisonView() {
  if (compareIds.length < 2) return;
  const properties = compareIds.map(id => knownProperties[id]).filter(Boolean);
  if (properties.length < 2) return;

  workspaceState = 'compare';
  const ws = $('#concierge-workspace');
  ws.dataset.state = 'compare';

  $('#compare-tab').hidden = false;
  switchMobilePanel('compare');

  $('#map-panel').innerHTML = renderMapPanel(properties, { labels: ['A', 'B'] });
  $('#comparison-column').innerHTML = `
    <div class="comparison-header">
      <span class="comparison-header__title">Comparing ${properties.length} stays</span>
      <button class="btn btn--sm btn--outline" data-action="close-comparison">← Back to results</button>
    </div>
    <div class="comparison-body">${renderComparisonMatrix(properties)}</div>
  `;

  $('#compare-fab').hidden = true;
}

export function closeComparisonView() {
  workspaceState = 'split';
  const ws = $('#concierge-workspace');
  if (ws) ws.dataset.state = 'split';
  $('#compare-tab').hidden = true;
  switchMobilePanel('chat');
  updateMapPanel();
  const fab = $('#compare-fab');
  if (fab) { fab.hidden = compareIds.length < 2; fab.textContent = `Compare ${compareIds.length} stays →`; }
}

function updateMapPanel() {
  if (workspaceState === 'compare') return; // comparison view owns the map while active
  const panel = $('#map-panel');
  if (panel) panel.innerHTML = renderMapPanel(currentResults);
}

// ── Mobile tab switching ──────────────────────────────────────

export function switchMobilePanel(panel) {
  mobilePanel = panel;
  const ws = $('#concierge-workspace');
  if (ws) ws.dataset.panel = panel;
  document.querySelectorAll('.workspace-tab').forEach(tab => {
    tab.dataset.active = String(tab.dataset.panel === panel);
  });
}

// ── Itinerary drawer ─────────────────────────────────────────

function renderItineraryDrawer() {
  return `
    <div class="itinerary-drawer" id="itinerary-drawer" data-component="itinerary-drawer" role="dialog" aria-modal="true">
      <div class="itinerary-drawer__backdrop" data-action="close-itinerary"></div>
      <div class="itinerary-drawer__panel">
        <div class="itinerary-drawer__handle"></div>
        <h2 class="itinerary-drawer__title">🧳 Your Itinerary</h2>
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
        <div id="itinerary-list">${renderDrawerListContent()}</div>
        <button class="itinerary-drawer__checkout" data-action="checkout-whatsapp">
          ${ICONS.whatsapp} Send Enquiry via WhatsApp
        </button>
      </div>
    </div>
  `;
}

function renderDrawerListContent() {
  const items = getItinerary();
  if (!items.length) {
    return `<div class="itinerary-drawer__empty"><div class="itinerary-drawer__empty-icon">🧳</div>No properties yet — chat with the concierge to discover stays!</div>`;
  }
  return items.map(item => `
    <div class="itinerary-item" data-item-id="${item.id}">
      <div class="itinerary-item__icon">${item.emoji}</div>
      <div class="itinerary-item__body">
        <div class="itinerary-item__name">${escapeHTML(item.name)}</div>
        <div class="itinerary-item__meta">${escapeHTML(item.location)} · ${escapeHTML(item.priceEstimate)}</div>
      </div>
      <button class="itinerary-item__remove" data-action="remove-from-itinerary" data-property-id="${item.id}">Remove</button>
    </div>
  `).join('');
}

function refreshDrawerList() {
  const el = $('#itinerary-list');
  if (el) el.innerHTML = renderDrawerListContent();
}

export function openItineraryDrawer() {
  $('#itinerary-drawer')?.classList.add('is-open');
}
export function closeItineraryDrawer() {
  $('#itinerary-drawer')?.classList.remove('is-open');
}

export function handleRemoveFromItinerary(propertyId) {
  removeFromItinerary(propertyId);
}

export function checkoutToWhatsApp() {
  const items = getItinerary();
  if (!items.length) return;
  const checkIn = $('#date-checkin')?.value || '';
  const checkOut = $('#date-checkout')?.value || '';
  const message = buildItineraryMessage(items, { checkIn, checkOut });
  openExternal(waLink(message));
}
