/**
 * app.js — the kernel.
 * Route dispatch (via router.js) + ALL delegated event wiring for the app.
 * Pages/components only render markup with data-action attributes;
 * this file is the single place that interprets those attributes.
 */

import { initRouter, onRouteChange } from './router.js';
import { renderHomePage } from './pages/home.js';
import {
  renderWorkspacePage, submitChatInput, handleQuery, handleAddToCart, handleViewMap,
  handleToggleCompare, openComparisonView, handleRemoveFromCart, handleCheckoutPlatform,
  handleContactChannel, switchPane, closeInAppBrowser, handleFocusProperty,
} from './pages/workspace.js';
import { renderLoginPage } from './pages/login.js';
import { renderDashboardPage, openNewPropertyModal, openEditPropertyModal,
         handlePropertyFormSubmit, handleDeleteProperty } from './pages/dashboard.js';
import { closeModal } from './components/modal.js';
import { login, logout, isLoggedIn } from './utilities/auth.js';
import { loadProperties } from './services/dataLoader.js';
import { toast, $ } from './utilities/helpers.js';

const ROOT_ID = 'app-root';

function getRoot() {
  return document.getElementById(ROOT_ID);
}

// ── Route dispatch ────────────────────────────────────────────

async function handleRoute({ segments }) {
  const root = getRoot();
  if (!root) return;

  window.scrollTo(0, 0);

  if (segments.length === 0) {
    await renderHomePage(root);
  } else if (segments[0] === 'app' || segments[0] === 'chat') {
    // 'chat' kept as an alias so old deep links / bookmarks still work.
    renderWorkspacePage(root);
  } else if (segments[0] === 'login') {
    if (isLoggedIn()) { window.location.hash = '#/dashboard'; return; }
    renderLoginPage(root);
  } else if (segments[0] === 'dashboard') {
    const view = segments[1] || 'overview';
    await renderDashboardPage(root, view);
  } else {
    await renderHomePage(root); // fallback
  }

  wireHeaderScrollEffect();
}

function wireHeaderScrollEffect() {
  const nav = $('#site-nav');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('nav--scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ── Delegated click handling ──────────────────────────────────

document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;

  switch (action) {
    case 'open-cart-pane':
      if ($('#app-panes')) {
        switchPane('cart');
      } else {
        window.location.hash = '#/app?pane=cart';
      }
      break;

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

    case 'explore-destination': {
      const id = el.dataset.destinationId || '';
      window.location.hash = `#/app?q=${encodeURIComponent(id)}`;
      break;
    }

    case 'focus-property':
      handleFocusProperty(el.dataset.propertyId);
      break;

    case 'send-chat-message':
      submitChatInput();
      break;

    case 'quick-reply':
      handleQuery(el.dataset.query || '', { fromChat: true });
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

    case 'admin-logout':
      logout();
      window.location.hash = '#/login';
      break;

    case 'new-property':
      await openNewPropertyModal();
      break;

    case 'edit-property':
      await openEditPropertyModal(el.dataset.propertyId);
      break;

    case 'delete-property':
      if (confirm('Remove this property listing?')) handleDeleteProperty(el.dataset.propertyId);
      break;

    default:
      break;
  }
});

// ── Delegated submit handling ─────────────────────────────────

document.addEventListener('submit', (e) => {
  const form = e.target.closest('[data-action]');
  if (!form) return;
  const action = form.dataset.action;

  if (action === 'submit-login') {
    e.preventDefault();
    const data = new FormData(form);
    const ok = login(data.get('email'), data.get('password'));
    if (ok) {
      toast('Signed in.', { type: 'success' });
      window.location.hash = '#/dashboard';
    } else {
      toast('Invalid credentials.', { type: 'error' });
    }
    return;
  }

  if (action === 'submit-property-form') {
    e.preventDefault();
    handlePropertyFormSubmit(form);
    return;
  }

  if (form.id === 'hero-search-form') {
    e.preventDefault();
    const q = form.querySelector('#hero-search-input')?.value.trim() || '';
    window.location.hash = `#/app?q=${encodeURIComponent(q)}`;
  }
});

// ── Boot ─────────────────────────────────────────────────────

onRouteChange(handleRoute);
initRouter();
