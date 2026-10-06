/**
 * helpers.js — DOM query/inject helpers, formatting, toast.
 */

export const $  = (sel, ctx = document) => ctx.querySelector(sel);
export const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/** Set innerHTML of the node matching sel (or the node itself). */
export function inject(target, html) {
  const node = typeof target === 'string' ? $(target) : target;
  if (node) node.innerHTML = html;
  return node;
}

/** Escape user-provided text before interpolating into template strings. */
export function escapeHTML(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Format a number as a currency string, e.g. formatPrice(220, 'USD') -> "$220". */
export function formatPrice(amount, currency = 'USD') {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Lightweight toast notification. Injects a container on first use. */
let _toastTimer = null;
export function toast(message, { type = 'info', duration = 2600 } = {}) {
  let el = $('#rr-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'rr-toast';
    el.style.cssText = `
      position:fixed; left:50%; bottom:28px; transform:translateX(-50%) translateY(20px);
      background:#1c1710; color:#fffdf9; padding:.75rem 1.25rem; border-radius:999px;
      font-size:.85rem; font-family:'Inter',system-ui,sans-serif; z-index:9999; opacity:0;
      transition:opacity .25s ease, transform .25s ease; box-shadow:0 10px 30px rgba(0,0,0,.25);
      pointer-events:none; max-width:90vw; text-align:center;
    `;
    document.body.appendChild(el);
  }
  const colors = { info: '#1c1710', success: '#3f8a5f', error: '#c0432f' };
  el.style.background = colors[type] || colors.info;
  el.textContent = message;
  requestAnimationFrame(() => {
    el.style.opacity = '1';
    el.style.transform = 'translateX(-50%) translateY(0)';
  });
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(-50%) translateY(20px)';
  }, duration);
}

/** Debounce a function by `wait` ms. */
export function debounce(fn, wait = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}
