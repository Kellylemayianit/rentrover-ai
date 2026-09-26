/**
 * modal.js — one shared modal shell, used for the map view and the
 * stay-comparison table (see pages/workspace.js).
 */

import { $ } from '../utilities/helpers.js';

const MODAL_ID = 'rr-modal-root';

function ensureRoot() {
  let root = document.getElementById(MODAL_ID);
  if (!root) {
    root = document.createElement('div');
    root.id = MODAL_ID;
    document.body.appendChild(root);
  }
  return root;
}

/**
 * @param {{title:string, bodyHTML:string, onClose?:Function}} opts
 */
export function openModal({ title, bodyHTML, onClose } = {}) {
  const root = ensureRoot();
  root.innerHTML = `
    <div class="modal is-open" data-component="modal">
      <div class="modal__backdrop" data-action="close-modal"></div>
      <div class="modal__panel">
        <div class="modal__header">
          <h3>${title}</h3>
          <button class="modal__close" data-action="close-modal" aria-label="Close">&times;</button>
        </div>
        <div class="modal__body">${bodyHTML}</div>
      </div>
    </div>
  `;
  root._onClose = onClose;
}

export function closeModal() {
  const root = document.getElementById(MODAL_ID);
  if (!root) return;
  if (typeof root._onClose === 'function') root._onClose();
  root.innerHTML = '';
}

export function isModalOpen() {
  return !!$(`#${MODAL_ID} .modal.is-open`);
}
