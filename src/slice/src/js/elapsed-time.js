import { formatted_time_since } from './elapsed-time-format.js';

const ELAPSED_SELECTOR = '.news-list-item__date .date-time-value--elapsed-time, .author-byline__published .date-time-value--elapsed-time';
const DOCUMENT_CLOCKS = new WeakMap();

function create_document_clock(page_document) {
  const page_window = page_document.defaultView;
  const tracked_elements = new Set();
  let timer_handle;

  function refresh_times() {
    const reference_date = new Date();
    for (const time_element of tracked_elements) {
      if (!time_element.isConnected) {
        tracked_elements.delete(time_element);
        continue;
      }
      const source_date = time_element.getAttribute('datetime');
      if (!source_date || Number.isNaN(Date.parse(source_date))) continue;
      const display_locale = time_element.closest('[lang]')?.getAttribute('lang') || 'en';
      const unit_labels = JSON.parse(time_element.dataset.timeUnitLabels || '{}');
      const elapsed_text = formatted_time_since(source_date, unit_labels, reference_date, display_locale);
      const suffix_text = time_element.dataset.timeSuffix;
      const display_text = suffix_text ? `${elapsed_text} ${suffix_text}` : elapsed_text;
      if (time_element.textContent !== display_text) time_element.textContent = display_text;
    }
    if (!tracked_elements.size) stop_clock();
  }

  function stop_clock() {
    page_window.clearInterval(timer_handle);
    page_document.removeEventListener('visibilitychange', resume_clock);
    page_window.removeEventListener('pageshow', refresh_times);
    DOCUMENT_CLOCKS.delete(page_document);
  }

  function resume_clock() {
    page_window.clearInterval(timer_handle);
    if (page_document.hidden) return;
    refresh_times();
    if (tracked_elements.size) timer_handle = page_window.setInterval(refresh_times, 1000);
  }

  page_document.addEventListener('visibilitychange', resume_clock);
  page_window.addEventListener('pageshow', refresh_times);
  return { tracked_elements, resume_clock, stop_clock };
}

export function initialize_elapsed_times(page_context) {
  const time_elements = [...page_context.querySelectorAll(ELAPSED_SELECTOR)];
  if (page_context.matches?.(ELAPSED_SELECTOR)) time_elements.unshift(page_context);
  if (!time_elements.length) return;
  const page_document = page_context.ownerDocument || page_context;
  let document_clock = DOCUMENT_CLOCKS.get(page_document);
  if (!document_clock) {
    document_clock = create_document_clock(page_document);
    DOCUMENT_CLOCKS.set(page_document, document_clock);
  }
  time_elements.forEach((time_element) => document_clock.tracked_elements.add(time_element));
  document_clock.resume_clock();
}

export function detach_elapsed_times(page_context) {
  const page_document = page_context.ownerDocument || page_context;
  const document_clock = DOCUMENT_CLOCKS.get(page_document);
  if (!document_clock) return;
  for (const time_element of document_clock.tracked_elements) {
    if (page_context === time_element || page_context.contains(time_element)) {
      document_clock.tracked_elements.delete(time_element);
    }
  }
  if (!document_clock.tracked_elements.size) document_clock.stop_clock();
}
