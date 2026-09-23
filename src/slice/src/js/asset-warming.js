import { observe_loading_activity } from './loading-activity.js';

const PAGE_LIMIT = 2;
const ASSET_LIMIT = 12;
const IMAGE_LIMIT = 3;
const DOWNLOAD_BUDGET = 8 * 1024 * 1024;
const ASSET_BYTE_LIMIT = 2 * 1024 * 1024;
const PUBLIC_LINK_SELECTOR = '.site-header__navigation a[href], .article-teaser__title-link[href], .article-teaser__image-link[href], .article-list-item__title-link[href]';

export function can_warm_assets(browser_navigator, page_document) {
  const connection_info = browser_navigator.connection;
  return browser_navigator.onLine !== false
    && !connection_info?.saveData
    && !/^(slow-2g|2g|3g)$/.test(connection_info?.effectiveType || '')
    && page_document.visibilityState === 'visible'
    && !page_document.body.classList.contains('user-logged-in');
}

export function public_page_url(link_element, current_url) {
  if (!link_element || link_element.hasAttribute('download')
    || link_element.getAttribute('target') === '_blank'
    || link_element.closest('[data-no-prefetch]')) {
    return null;
  }
  const target_url = new URL(link_element.href, current_url);
  const source_url = new URL(current_url);
  if (!/^https?:$/.test(target_url.protocol) || target_url.origin !== source_url.origin
    || target_url.search || target_url.hash || target_url.pathname === source_url.pathname
    || /\/(?:admin|user|session|cart|checkout|search)(?:\/|$)/i.test(target_url.pathname)
    || /\/(?:edit|delete|logout|add)(?:\/|$)/i.test(target_url.pathname)
    || /\.[a-z0-9]+$/i.test(target_url.pathname)) {
    return null;
  }
  return target_url.href;
}

function same_origin_asset(asset_source, page_url) {
  try {
    const asset_url = new URL(asset_source, page_url);
    const destination_url = new URL(page_url);
    return /^https?:$/.test(asset_url.protocol) && asset_url.origin === destination_url.origin
      && !asset_url.hash ? asset_url.href : null;
  } catch {
    return null;
  }
}

/** Inspect inert HTML only. Small image stages precede larger stages and shared code. */
export function collect_page_assets(page_source, page_url, page_window, page_document) {
  const source_template = page_document.createElement('template');
  source_template.innerHTML = page_source;
  const asset_candidates = [];
  const candidate_urls = new Set();
  const target_width = Math.min(1280, page_window.innerWidth * (page_window.devicePixelRatio || 1));
  function add_candidate(asset_source, asset_priority, asset_kind) {
    if (!asset_source) return;
    const asset_url = same_origin_asset(asset_source, page_url);
    if (!asset_url || candidate_urls.has(asset_url)) return;
    candidate_urls.add(asset_url);
    asset_candidates.push({ asset_url, asset_priority, asset_kind });
  }
  let image_count = 0;
  for (const image_element of source_template.content.querySelectorAll('img')) {
    if (image_element.closest('noscript, [data-no-prefetch]') || image_count >= IMAGE_LIMIT) continue;
    const candidate_count = asset_candidates.length;
    let image_stages = [];
    if (image_element.hasAttribute('data-photo-stages')) {
      try {
        const stage_data = JSON.parse(image_element.getAttribute('data-photo-stages'));
        if (Array.isArray(stage_data)) image_stages = stage_data.filter((image_stage) =>
          Number.isFinite(image_stage?.image_width) && image_stage.image_width > 0
          && typeof image_stage.image_url === 'string');
      } catch { /* A malformed photo must not prevent other images being warmed. */ }
    } else {
      // Honor picture media conditions; unknown formats retain the img fallback.
      const picture_source = [...(image_element.closest('picture')?.querySelectorAll('source[srcset]') || [])]
        .find((source_element) => (!source_element.media || page_window.matchMedia(source_element.media).matches)
          && (!source_element.type || /^(image\/(jpeg|png|webp|svg\+xml))$/.test(source_element.type)));
      const source_set = picture_source?.getAttribute('srcset') || image_element.getAttribute('srcset') || '';
      image_stages = source_set.split(',').flatMap((source_candidate) => {
        const candidate_match = source_candidate.trim().match(/^(\S+)\s+(\d+(?:\.\d+)?)(w|x)$/);
        return candidate_match ? [{ image_url: candidate_match[1], image_width: Number(candidate_match[2])
          * (candidate_match[3] === 'x' ? page_window.innerWidth : 1) }] : [];
      });
    }
    image_stages.sort((first_stage, second_stage) => first_stage.image_width - second_stage.image_width);
    if (image_stages.length) {
      // Never speculate on an oversized original when a modest derivative exists.
      const selected_stages = image_stages.filter((image_stage) => image_stage.image_width <= target_width);
      if (!selected_stages.length) selected_stages.push(image_stages[0]);
      selected_stages.forEach((image_stage, stage_index) => {
        add_candidate(image_stage.image_url, stage_index === 0 ? 0 : image_stage.image_width, 'image');
      });
    } else {
      add_candidate(image_element.getAttribute('src'), 0, 'image');
    }
    if (asset_candidates.length > candidate_count) image_count += 1;
  }
  for (const asset_element of source_template.content.querySelectorAll('link[rel="stylesheet"][href], script[src]')) {
    if (asset_element.closest('noscript, [data-no-prefetch]')) continue;
    add_candidate(asset_element.getAttribute('src') || asset_element.getAttribute('href'), 2000,
      asset_element.tagName === 'SCRIPT' ? 'script' : 'style');
  }
  return asset_candidates.sort((first_asset, second_asset) => first_asset.asset_priority - second_asset.asset_priority)
    .slice(0, ASSET_LIMIT);
}

// HTTP cache remains the authority: no service worker, private cache, or stale-copy serving.
export function install_asset_warming(page_window = window, page_document = document, initial_task = null) {
  if (page_document.documentElement.dataset.assetWarmingInitialized) return;
  page_document.documentElement.dataset.assetWarmingInitialized = 'true';
  const warmed_pages = new Set();
  const queued_assets = new Set();
  const background_urls = new Set();
  const pending_pages = [];
  const pending_assets = [];
  let active_controller = null;
  let request_active = false;
  let initial_pending = Boolean(initial_task);
  let timer_handle = null;
  let downloaded_bytes = 0;
  let paused_request = false;

  function schedule_queue() {
    if (timer_handle !== null || request_active) return;
    if (!initial_pending && !pending_pages.length && !pending_assets.length) return;
    timer_handle = page_window.setTimeout(() => {
      timer_handle = null;
      void run_queue();
    }, 250);
  }
  const loading_activity = observe_loading_activity(page_window, page_document, () => {
    // A scroll, image upgrade, hidden tab or new resource completion yields to the page.
    if (active_controller) {
      paused_request = true;
      active_controller.abort();
    }
    schedule_queue();
  }, background_urls);

  function enqueue_page(link_element, prioritize_page = false) {
    const page_url = public_page_url(link_element, page_window.location.href);
    if (!page_url || warmed_pages.has(page_url)) return;
    const pending_index = pending_pages.indexOf(page_url);
    if (pending_index >= 0) pending_pages.splice(pending_index, 1);
    if (prioritize_page) pending_pages.unshift(page_url);
    else pending_pages.push(page_url);
    // Intent can replace the second automatic candidate until that page starts.
    pending_pages.splice(PAGE_LIMIT - warmed_pages.size);
    schedule_queue();
  }

  async function download_resource(resource_url, is_page, request_signal) {
    background_urls.add(resource_url);
    const resource_response = await page_window.fetch(resource_url, {
      credentials: 'same-origin', mode: 'same-origin', redirect: 'error',
      priority: 'low', signal: request_signal,
      ...(is_page ? { headers: { Accept: 'text/html' } } : {}),
    });
    if (!resource_response.ok || /no-store|private/i.test(resource_response.headers.get('cache-control') || '')
      || (is_page && !resource_response.headers.get('content-type')?.includes('text/html'))) {
      await resource_response.body?.cancel();
      return null;
    }
    const byte_limit = is_page ? 262144 : ASSET_BYTE_LIMIT;
    const resource_reader = resource_response.body.getReader();
    const text_decoder = new TextDecoder();
    let resource_source = '';
    let resource_bytes = 0;
    while (true) {
      const response_chunk = await resource_reader.read();
      if (response_chunk.done) break;
      resource_bytes += response_chunk.value.byteLength;
      downloaded_bytes += response_chunk.value.byteLength;
      if (resource_bytes > byte_limit || downloaded_bytes > DOWNLOAD_BUDGET) {
        await resource_reader.cancel();
        return null;
      }
      if (is_page) resource_source += text_decoder.decode(response_chunk.value, { stream: true });
    }
    // Reading to completion lets the browser store the response in its normal HTTP cache.
    return is_page ? resource_source + text_decoder.decode() : '';
  }

  async function run_queue() {
    if (request_active) return;
    if (!loading_activity.is_quiet()) {
      if (loading_activity.is_available()) schedule_queue();
      return;
    }
    if (initial_pending) {
      initial_pending = false;
      request_active = true;
      try { await initial_task(); } catch { /* Optional catalog failure must not block media. */ }
      finally { request_active = false; loading_activity.mark_activity(); schedule_queue(); }
      return;
    }
    if (!can_warm_assets(page_window.navigator, page_document)) return;
    if (downloaded_bytes >= DOWNLOAD_BUDGET) {
      pending_pages.length = 0;
      pending_assets.length = 0;
      return;
    }
    // Inspect both bounded destinations before spending bandwidth on larger images.
    const page_url = pending_pages.shift();
    const asset_entry = page_url ? null : pending_assets.shift();
    if (!page_url && !asset_entry) return;
    if (page_url) warmed_pages.add(page_url);
    const request_controller = new AbortController();
    active_controller = request_controller;
    request_active = true;
    paused_request = false;
    const timeout_handle = page_window.setTimeout(() => request_controller.abort(), page_url ? 5000 : 10000);
    try {
      const page_source = await download_resource(page_url || asset_entry.asset_url, Boolean(page_url), request_controller.signal);
      if (page_url && page_source !== null) {
        for (const asset_candidate of collect_page_assets(page_source, page_url, page_window, page_document)) {
          if (queued_assets.has(asset_candidate.asset_url)
            || page_window.performance.getEntriesByName(asset_candidate.asset_url).some((resource_entry) => resource_entry.responseEnd > 0)) continue;
          queued_assets.add(asset_candidate.asset_url);
          pending_assets.push(asset_candidate);
        }
        pending_assets.sort((first_asset, second_asset) => first_asset.asset_priority - second_asset.asset_priority);
      }
    } catch {
      // Interruption is resumable; errors and timeouts are skipped without affecting navigation.
      if (paused_request) {
        if (page_url) { warmed_pages.delete(page_url); pending_pages.unshift(page_url); }
        else pending_assets.unshift(asset_entry);
      }
    } finally {
      active_controller = null;
      request_active = false;
      page_window.clearTimeout(timeout_handle);
      loading_activity.mark_activity();
      schedule_queue();
    }
  }

  function warm_intended_link(pointer_event) {
    const target_link = pointer_event.target.closest?.(PUBLIC_LINK_SELECTOR);
    if (target_link && warmed_pages.size < PAGE_LIMIT) enqueue_page(target_link, true);
  }
  page_document.addEventListener('pointerover', warm_intended_link, { passive: true });
  page_document.addEventListener('focusin', warm_intended_link);
  const candidate_links = [...page_document.querySelectorAll(PUBLIC_LINK_SELECTOR)];
  const article_links = candidate_links.filter((link_element) => link_element.matches('.article-teaser__title-link, .article-list-item__title-link'));
  for (const link_element of [...article_links, ...candidate_links]) {
    if (pending_pages.length >= PAGE_LIMIT) break;
    enqueue_page(link_element);
  }
  schedule_queue();
}
