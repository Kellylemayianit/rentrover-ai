/**
 * app.js — the kernel.
 * There is only one page (pages/workspace.js), so there's no route
 * dispatch here — just mount it once, and handle every data-action click
 * /submit in the app via delegation. Pages/components only render markup
 * with data-action attributes; this file is the single place that
 * interprets those attributes.
 */

import {
  renderWorkspacePage, handleAskQuestion, handleStaysSearch,
  handleAddToCart, handleViewMap, handleToggleCompare, openComparisonView,
  handleRemoveFromCart, handleCheckoutPlatform, handleContactChannel,
  switchPane, closeInAppBrowser, handleFocusProperty,
} from './pages/workspace.js';
import { closeModal } from './components/modal.js';

const ROOT_ID = 'app-root';

function boot() {
  const root = document.getElementById(ROOT_ID);
  if (root) renderWorkspacePage(root);
}

// ── Delegated click handling ──────────────────────────────────

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;

  switch (action) {
    case 'close-modal':
      closeModal();
      break;

    case 'close-inapp-browser':
      closeInAppBrowser();
      break;

    case 'add-to-cart':
      handleAddToCart(el.dataset.propertyId);
      break;

    case 'remove-from-cart':
      handleRemoveFromCart(el.dataset.propertyId);
      break;

    case 'checkout-platform':
      handleCheckoutPlatform(el.dataset.propertyId, el.dataset.platform);
      break;

    case 'contact-channel':
      handleContactChannel(el.dataset.channel);
      break;

    case 'view-map':
      handleViewMap();
      break;

    case 'quick-search':
      handleStaysSearch(el.dataset.query || '');
      break;

    case 'ask-suggestion':
      handleAskQuestion(el.dataset.query || '');
      break;

    case 'toggle-compare':
      handleToggleCompare(el.dataset.propertyId);
      break;

    case 'open-comparison':
      openComparisonView();
      break;

    case 'switch-pane':
      switchPane(el.dataset.pane);
      break;

    case 'focus-property':
      handleFocusProperty(el.dataset.propertyId);
      break;

    default:
      break;
  }
});

// ── Boot ─────────────────────────────────────────────────────

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
