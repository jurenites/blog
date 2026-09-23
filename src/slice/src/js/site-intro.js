// Runs in the head, before the first paint and independently of Drupal behaviors.
import { install_card_loading } from './card-loading.js';

install_card_loading();

const INTRO_STORAGE_KEY = 'jurenites.site-intro';
const INTRO_REPEAT_INTERVAL = 24 * 60 * 60 * 1000;
const INTRO_READY_LIMIT = 4000;
const root_element = document.documentElement;
let completion_timeout;
let original_inert = false;
let intro_started = false;

function read_intro_timestamp() {
  try {
    const stored_visit = JSON.parse(localStorage.getItem(INTRO_STORAGE_KEY));
    if (stored_visit?.loading === true) return Number(stored_visit.shown_at);
  } catch {
    // Session storage can still preserve navigation when persistent storage fails.
  }
  try {
    const stored_visit = JSON.parse(sessionStorage.getItem(INTRO_STORAGE_KEY));
    if (stored_visit?.loading === true) return Number(stored_visit.shown_at);
  } catch {
    // If all browser storage is blocked, persistence is unavailable.
  }
  return NaN;
}

function remember_intro_visit() {
  const shown_at = Date.now();
  try {
    localStorage.setItem(INTRO_STORAGE_KEY, JSON.stringify({ loading: true, shown_at }));
  } catch {
    // Storage restrictions must never prevent the page from opening.
  }
  try {
    sessionStorage.setItem(INTRO_STORAGE_KEY, JSON.stringify({ loading: true, shown_at }));
  } catch {
    // If both stores are blocked, the intro can only be remembered in this page.
  }
}

function finish_site_intro() {
  window.clearTimeout(completion_timeout);
  root_element.removeAttribute('data-site-intro');
  if (intro_started) document.body.inert = original_inert;
}

function start_site_intro() {
  if (root_element.getAttribute('data-site-intro') !== 'pending') return;
  const branding_element = document.getElementById('block-jurenites-theme-site-branding');
  if (!branding_element) {
    finish_site_intro();
    return;
  }

  remember_intro_visit();
  root_element.setAttribute('data-site-intro', 'running');
  branding_element.addEventListener('animationend', (animation_event) => {
    if (animation_event.animationName === 'site-intro-arrive') finish_site_intro();
  });
  const duration_value = getComputedStyle(branding_element).animationDuration.trim();
  const duration_milliseconds = parseFloat(duration_value)
    * (duration_value.endsWith('ms') ? 1 : 1000);
  // Also release the canvas if CSS animations are interrupted or unavailable.
  window.clearTimeout(completion_timeout);
  completion_timeout = window.setTimeout(finish_site_intro, (duration_milliseconds || 2000) + 150);
}

function prepare_site_intro() {
  if (root_element.getAttribute('data-site-intro') !== 'pending') return;
  intro_started = true;
  original_inert = document.body.inert;
  document.body.inert = true;
  const page_ready = new Promise((resolve_ready) => {
    if (document.readyState === 'complete') resolve_ready();
    else window.addEventListener('load', resolve_ready, { once: true });
  });
  const ready_timeout = new Promise((resolve_ready) => {
    window.setTimeout(resolve_ready, INTRO_READY_LIMIT);
  });
  Promise.race([
    Promise.all([page_ready, document.fonts?.ready]),
    ready_timeout,
  ]).then(start_site_intro, finish_site_intro);
}

try {
  const previous_timestamp = read_intro_timestamp();
  const elapsed_duration = Date.now() - previous_timestamp;
  const already_seen = Number.isFinite(previous_timestamp)
    && elapsed_duration >= 0 && elapsed_duration < INTRO_REPEAT_INTERVAL;

  if (already_seen || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    finish_site_intro();
  } else {
    root_element.setAttribute('data-site-intro', 'pending');
    completion_timeout = window.setTimeout(finish_site_intro, 8000);
    document.addEventListener('DOMContentLoaded', prepare_site_intro, { once: true });
    window.addEventListener('pageshow', (page_event) => {
      if (page_event.persisted) finish_site_intro();
    });
  }
} catch {
  finish_site_intro();
}
