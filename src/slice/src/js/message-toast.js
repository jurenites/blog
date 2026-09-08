// Share the message renderer with Storybook; retain Drupal's message API.
export function create_message_toast(message_html, message_options, message_labels, dismiss_label) {
  const message_type = message_options.type;
  const message_element = document.createElement('div');
  message_element.className = `messages messages--${message_type} message-toast message-toast--${message_type}`;
  message_element.setAttribute('role', message_type === 'status' ? 'status' : 'alert');
  message_element.setAttribute('aria-label', message_labels[message_type]);
  message_element.setAttribute('data-drupal-message-id', message_options.id);
  message_element.setAttribute('data-drupal-message-type', message_type);
  const message_heading = document.createElement('strong');
  message_heading.className = 'message-toast__heading';
  message_heading.textContent = message_labels[message_type];
  const message_content = document.createElement('div');
  message_content.className = 'message-toast__content';
  // Drupal.Message accepts trusted HTML, including links from AJAX responses.
  message_content.innerHTML = message_html;
  const dismiss_button = document.createElement('button');
  dismiss_button.type = 'button';
  dismiss_button.className = 'message-toast__dismiss';
  dismiss_button.setAttribute('aria-label', `${dismiss_label}: ${message_labels[message_type]}`);
  dismiss_button.textContent = '×';
  message_element.append(message_heading, message_content, dismiss_button);
  // Drupal inserts the returned element synchronously; start once it is mounted.
  queueMicrotask(() => initialize_message_timeout(message_element));
  return message_element;
}

const INITIALIZED_ROOTS = new WeakSet();
const MESSAGE_TIMERS = new WeakMap();
const MESSAGE_DURATIONS = { status: 6000, warning: 10000 };

export function initialize_message_timeout(message_element) {
  if (MESSAGE_TIMERS.has(message_element)) return;
  const message_type = message_element.getAttribute('data-drupal-message-type')
    || (message_element.classList.contains('message-toast--warning') ? 'warning'
      : message_element.classList.contains('message-toast--status') ? 'status' : 'error');
  let remaining_duration = MESSAGE_DURATIONS[message_type];
  if (!remaining_duration) return;
  let timeout_handle;
  let started_time;

  function pause_timeout() {
    if (timeout_handle === undefined) return;
    clearTimeout(timeout_handle);
    timeout_handle = undefined;
    remaining_duration = Math.max(0, remaining_duration - (performance.now() - started_time));
  }

  function resume_timeout() {
    if (timeout_handle !== undefined || message_element.matches(':hover, :focus-within')) return;
    started_time = performance.now();
    timeout_handle = setTimeout(() => {
      timeout_handle = undefined;
      // Recheck focus/hover in case they changed immediately before expiry.
      if (message_element.matches(':hover, :focus-within')) {
        remaining_duration = 0;
        return;
      }
      message_element.remove();
    }, remaining_duration);
  }

  message_element.addEventListener('mouseenter', pause_timeout);
  message_element.addEventListener('mouseleave', resume_timeout);
  message_element.addEventListener('focusin', pause_timeout);
  message_element.addEventListener('focusout', () => queueMicrotask(resume_timeout));
  MESSAGE_TIMERS.set(message_element, pause_timeout);
  resume_timeout();
}

export function initialize_message_toasts(message_root = document) {
  message_root.querySelectorAll('.message-toast').forEach(initialize_message_timeout);
  message_root.querySelectorAll('.message-toast__dismiss[hidden]').forEach((dismiss_button) => {
    dismiss_button.hidden = false;
  });
  if (INITIALIZED_ROOTS.has(message_root)) return;
  INITIALIZED_ROOTS.add(message_root);
  message_root.addEventListener('click', (click_event) => {
    const dismiss_button = click_event.target.closest?.('.message-toast__dismiss');
    if (!dismiss_button) return;
    const message_element = dismiss_button.closest('.message-toast');
    const message_region = message_element.closest('[data-drupal-messages]') || message_element.parentElement;
    const dismiss_buttons = [...message_region.querySelectorAll('.message-toast__dismiss')];
    const button_index = dismiss_buttons.indexOf(dismiss_button);
    const focus_target = dismiss_buttons[button_index + 1] || dismiss_buttons[button_index - 1];
    const restore_focus = document.activeElement === dismiss_button;
    MESSAGE_TIMERS.get(message_element)?.();
    message_element.remove();
    if (restore_focus) {
      if (focus_target) focus_target.focus();
      else {
        const main_content = document.querySelector('main');
        if (main_content) {
          const previous_tabindex = main_content.getAttribute('tabindex');
          main_content.setAttribute('tabindex', '-1');
          main_content.focus({ preventScroll: true });
          if (previous_tabindex === null) main_content.removeAttribute('tabindex');
          else main_content.setAttribute('tabindex', previous_tabindex);
        }
      }
    }
  });
}

export function install_message_toasts(drupal_api) {
  drupal_api.theme.message = (message_data, message_options) => create_message_toast(
    message_data.text,
    message_options,
    drupal_api.Message.getMessageTypeLabels(),
    drupal_api.t('Dismiss message'),
  );
  drupal_api.behaviors.jurenites_message_toasts = {
    attach() { initialize_message_toasts(document); },
  };
}
