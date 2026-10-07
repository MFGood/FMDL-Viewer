// notices.js — the status line and error box in the viewport's top-right corner.

import { $ } from './dom.js';

// An error you dismiss isn't shown again until something new is opened or reloaded.
const dismissed = new Set();
let flashTimer = null;

/** Show a short progress message, or hide it with null. */
export function setStatus(message) {
  $('status').hidden = !message;
  $('status').textContent = message || '';
}

/** Show a status message that clears itself after a moment. */
export function flashStatus(message) {
  setStatus(message);
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => { if ($('status').textContent === message) setStatus(null); }, 2500);
}

export function showError(message) {
  if (dismissed.has(message)) return;
  $('errText').textContent = message;
  $('err').hidden = false;
}

export function hideError() { $('err').hidden = true; }

/** Let dismissed errors show again (when something new is opened or reloaded). */
export function forgetDismissedErrors() { dismissed.clear(); }

export function initNotices() {
  $('errClose').addEventListener('click', () => { dismissed.add($('errText').textContent); hideError(); });
}
