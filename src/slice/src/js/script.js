const NOISE_FRAMES_PER_SECOND = 15;
const NOISE_FRAME_INTERVAL = 1000 / NOISE_FRAMES_PER_SECOND;
const SELECT_CHEVRON_URL = typeof document !== 'undefined' && document.currentScript?.src
  ? new URL('../assets/icons/chevron-down.svg', document.currentScript.src).href
  : '/assets/icons/chevron-down.svg';

const VERTEX_SHADER_SOURCE = `
  attribute vec2 a_canvas_position;

  void main() {
    gl_Position = vec4(a_canvas_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER_SOURCE = `
  precision highp float;

  uniform float u_noise_frame;

  float staticHash(vec3 noise_position) {
    noise_position = fract(noise_position * vec3(0.1031, 0.1030, 0.0973));
    noise_position += dot(noise_position, noise_position.yxz + 33.33);
    return fract((noise_position.x + noise_position.y) * noise_position.z);
  }

  void main() {
    vec2 logical_pixel = floor(gl_FragCoord.xy);
    float noise_value = staticHash(vec3(logical_pixel, u_noise_frame));
    float displayed_tone = mix(0.04, 0.34, noise_value);

    gl_FragColor = vec4(vec3(displayed_tone), 1.0);
  }
`;

function create_shader(gl_context, shader_type, shader_source) {
  const compiled_shader = gl_context.createShader(shader_type);
  gl_context.shaderSource(compiled_shader, shader_source);
  gl_context.compileShader(compiled_shader);

  if (!gl_context.getShaderParameter(compiled_shader, gl_context.COMPILE_STATUS)) {
    throw new Error(
      gl_context.getShaderInfoLog(compiled_shader) || 'Media loader shader failed to compile.',
    );
  }

  return compiled_shader;
}

function create_program(gl_context) {
  const shader_program = gl_context.createProgram();
  gl_context.attachShader(
    shader_program,
    create_shader(gl_context, gl_context.VERTEX_SHADER, VERTEX_SHADER_SOURCE),
  );
  gl_context.attachShader(
    shader_program,
    create_shader(gl_context, gl_context.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE),
  );
  gl_context.linkProgram(shader_program);

  if (!gl_context.getProgramParameter(shader_program, gl_context.LINK_STATUS)) {
    throw new Error(
      gl_context.getProgramInfoLog(shader_program) || 'Media loader program failed to link.',
    );
  }

  return shader_program;
}

export function create_media_loader_noise(noise_surface) {
  const noise_canvas = document.createElement('canvas');
  const gl_context = noise_canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    failIfMajorPerformanceCaveat: true,
  });

  if (!gl_context) {
    return;
  }

  const shader_program = create_program(gl_context);
  const position_buffer = gl_context.createBuffer();
  const canvas_position_location = gl_context.getAttribLocation(
    shader_program,
    'a_canvas_position',
  );
  const noise_frame_location = gl_context.getUniformLocation(shader_program, 'u_noise_frame');
  const reduced_motion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let noise_frame = 0;
  let animation_frame = 0;
  let animation_timer = 0;

  noise_canvas.setAttribute('aria-hidden', 'true');
  noise_surface.appendChild(noise_canvas);

  gl_context.useProgram(shader_program);
  gl_context.bindBuffer(gl_context.ARRAY_BUFFER, position_buffer);
  gl_context.bufferData(
    gl_context.ARRAY_BUFFER,
    new Float32Array([-1, -1, -1, 3, 3, -1]),
    gl_context.STATIC_DRAW,
  );
  gl_context.enableVertexAttribArray(canvas_position_location);
  gl_context.vertexAttribPointer(
    canvas_position_location,
    2,
    gl_context.FLOAT,
    false,
    0,
    0,
  );

  function scheduleNoiseRender() {
    if (reduced_motion || animation_frame || animation_timer) {
      return;
    }

    animation_timer = window.setTimeout(() => {
      animation_timer = 0;
      animation_frame = window.requestAnimationFrame(renderNoiseFrame);
    }, NOISE_FRAME_INTERVAL);
  }

  function renderNoiseFrame() {
    gl_context.uniform1f(noise_frame_location, noise_frame);
    gl_context.drawArrays(gl_context.TRIANGLES, 0, 3);
    noise_frame = (noise_frame + 1) % 4096;
    animation_frame = 0;
    scheduleNoiseRender();
  }

  function resizeNoiseSurface() {
    const surface_bounds = noise_surface.getBoundingClientRect();
    const render_width = Math.max(1, Math.round(surface_bounds.width));
    const render_height = Math.max(1, Math.round(surface_bounds.height));

    if (noise_canvas.width !== render_width || noise_canvas.height !== render_height) {
      noise_canvas.width = render_width;
      noise_canvas.height = render_height;
      gl_context.viewport(0, 0, render_width, render_height);
    }

    renderNoiseFrame();
  }

  const noise_resize_observer = new ResizeObserver(resizeNoiseSurface);
  noise_resize_observer.observe(noise_surface);
  resizeNoiseSurface();

  noise_surface.jurenites_media_loader_destroy = function () {
    window.cancelAnimationFrame(animation_frame);
    window.clearTimeout(animation_timer);
    noise_resize_observer.disconnect();
    noise_canvas.remove();
    delete noise_surface.jurenites_media_loader_initialized;
    delete noise_surface.jurenites_media_loader_destroy;
  };
}

export function enable_article_back_link(back_link_element) {
  back_link_element.addEventListener('click', (click_event) => {
    const referrer_url = document.referrer ? new URL(document.referrer) : null;
    const has_same_origin_referrer = referrer_url?.origin === window.location.origin;

    if (!has_same_origin_referrer || window.history.length <= 1) {
      return;
    }

    click_event.preventDefault();
    window.history.back();
  });
}

export function enable_avatar_image_fallback(avatar_element) {
  const image_container = avatar_element.querySelector('[data-jurenites-avatar-image]');
  const image_element = image_container?.querySelector('img');

  if (!image_element) {
    return;
  }

  function show_avatar_fallback() {
    avatar_element.classList.add('avatar--image-failed');
  }

  image_element.addEventListener('error', show_avatar_fallback, { once: true });

  if (image_element.complete && image_element.naturalWidth === 0) {
    show_avatar_fallback();
  }
}

export function initialize_avatar_images(avatar_context) {
  avatar_context.querySelectorAll('[data-jurenites-avatar]').forEach((avatar_element) => {
    if (avatar_element.jurenites_avatar_initialized) {
      return;
    }

    avatar_element.jurenites_avatar_initialized = true;
    enable_avatar_image_fallback(avatar_element);
  });
}

export function enable_language_selector(language_select) {
  language_select.addEventListener('change', () => {
    const selected_language_url = language_select.value;

    if (selected_language_url) {
      window.location.assign(selected_language_url);
    }
  });
}

function associated_select_label(native_select) {
  if (!native_select.id) {
    return null;
  }

  return document.querySelector(`label[for="${CSS.escape(native_select.id)}"]`);
}

function next_enabled_option_index(option_elements, starting_index, direction) {
  let candidate_index = starting_index;

  for (let option_offset = 0; option_offset < option_elements.length; option_offset += 1) {
    candidate_index = (candidate_index + direction + option_elements.length)
      % option_elements.length;
    if (!option_elements[candidate_index].hasAttribute('aria-disabled')) {
      return candidate_index;
    }
  }

  return starting_index;
}

export function enable_custom_select(native_select) {
  if (
    native_select.jurenites_custom_select_initialized
    || native_select.multiple
    || native_select.size > 1
  ) {
    return;
  }

  native_select.jurenites_custom_select_initialized = true;

  const select_wrapper = document.createElement('div');
  const select_trigger = document.createElement('button');
  const selected_value_element = document.createElement('span');
  const suffix_element = document.createElement('span');
  const suffix_icon_element = document.createElement('span');
  const option_menu = document.createElement('ul');
  const native_options = Array.from(native_select.options);
  const select_label = associated_select_label(native_select);
  const listbox_id = `${native_select.id || native_select.name || 'select-input'}-listbox`;
  let active_option_index = native_select.selectedIndex >= 0 ? native_select.selectedIndex : 0;

  select_wrapper.className = 'select-input select-input--enhanced';
  if (native_select.disabled) {
    select_wrapper.classList.add('select-input--disabled');
  }

  select_trigger.className = 'select-input__trigger';
  select_trigger.id = `${native_select.id || native_select.name || 'select-input'}-trigger`;
  select_trigger.type = 'button';
  select_trigger.disabled = native_select.disabled;
  select_trigger.setAttribute('aria-haspopup', 'listbox');
  select_trigger.setAttribute('aria-expanded', 'false');
  select_trigger.setAttribute('aria-controls', listbox_id);
  if (native_select.required) {
    select_trigger.setAttribute('aria-required', 'true');
  }
  if (native_select.getAttribute('aria-invalid')) {
    select_trigger.setAttribute('aria-invalid', native_select.getAttribute('aria-invalid'));
  }

  if (select_label) {
    if (!select_label.id) {
      select_label.id = `${native_select.id}-label`;
    }
    select_trigger.setAttribute('aria-labelledby', select_label.id);
    select_label.htmlFor = select_trigger.id;
  } else {
    select_trigger.setAttribute(
      'aria-label',
      native_select.getAttribute('aria-label') || native_select.name || 'Select option',
    );
  }

  selected_value_element.className = 'select-input__value';
  suffix_element.className = 'select-input__suffix';
  suffix_element.setAttribute('aria-hidden', 'true');
  suffix_icon_element.className = 'select-input__suffix-icon';
  const chevron_asset_url = native_select.dataset.selectChevronUrl || SELECT_CHEVRON_URL;
  suffix_icon_element.style.setProperty('-webkit-mask-image', `url("${chevron_asset_url}")`);
  suffix_icon_element.style.setProperty('mask-image', `url("${chevron_asset_url}")`);
  suffix_element.appendChild(suffix_icon_element);
  select_trigger.append(selected_value_element, suffix_element);

  option_menu.className = 'select-input__menu';
  option_menu.id = listbox_id;
  option_menu.hidden = true;
  option_menu.setAttribute('role', 'listbox');
  if (select_trigger.hasAttribute('aria-labelledby')) {
    option_menu.setAttribute('aria-labelledby', select_trigger.getAttribute('aria-labelledby'));
  } else {
    option_menu.setAttribute('aria-label', select_trigger.getAttribute('aria-label'));
  }

  const option_elements = native_options.map((native_option, option_index) => {
    const option_element = document.createElement('li');
    option_element.className = 'select-input__option';
    option_element.id = `${listbox_id}-option-${option_index}`;
    option_element.tabIndex = -1;
    option_element.textContent = native_option.textContent;
    option_element.setAttribute('role', 'option');
    option_element.setAttribute('aria-selected', native_option.selected ? 'true' : 'false');
    if (native_option.disabled) {
      option_element.setAttribute('aria-disabled', 'true');
    }
    option_menu.appendChild(option_element);
    return option_element;
  });

  function synchronize_selected_option() {
    active_option_index = native_select.selectedIndex >= 0 ? native_select.selectedIndex : 0;
    selected_value_element.textContent = native_select.selectedOptions[0]?.textContent || '';
    option_elements.forEach((option_element, option_index) => {
      option_element.setAttribute(
        'aria-selected',
        option_index === native_select.selectedIndex ? 'true' : 'false',
      );
    });
  }

  function focus_option(option_index) {
    active_option_index = option_index;
    option_elements.forEach((option_element, current_index) => {
      option_element.classList.toggle('select-input__option--active', current_index === option_index);
    });
    option_elements[option_index]?.focus();
  }

  function update_option_menu_position() {
    if (option_menu.hidden) {
      return;
    }

    option_menu.style.maxHeight = '';

    const root_styles = getComputedStyle(document.documentElement);
    const viewport_margin = Number.parseFloat(
      root_styles.getPropertyValue('--space-scale-base-gap'),
    ) || 0;
    const menu_vertical_gap = Number.parseFloat(
      root_styles.getPropertyValue('--space-scale-two'),
    ) || 0;
    const visual_viewport = window.visualViewport;
    const viewport_top = visual_viewport?.offsetTop || 0;
    const viewport_height = visual_viewport?.height || window.innerHeight;
    const viewport_bottom = viewport_top + viewport_height;
    const trigger_bounds = select_trigger.getBoundingClientRect();
    const menu_styles = getComputedStyle(option_menu);
    const menu_border_height = Number.parseFloat(menu_styles.borderBlockStartWidth)
      + Number.parseFloat(menu_styles.borderBlockEndWidth);
    const preferred_menu_height = option_menu.scrollHeight + menu_border_height;
    const available_space_below = Math.max(
      0,
      viewport_bottom - trigger_bounds.bottom - menu_vertical_gap - viewport_margin,
    );
    const available_space_above = Math.max(
      0,
      trigger_bounds.top - viewport_top - menu_vertical_gap - viewport_margin,
    );
    const should_open_above = preferred_menu_height > available_space_below
      && available_space_above > available_space_below;
    const available_menu_height = should_open_above
      ? available_space_above
      : available_space_below;

    select_wrapper.classList.toggle('select-input--open-above', should_open_above);
    option_menu.style.maxHeight = preferred_menu_height <= available_menu_height
      ? 'none'
      : `${available_menu_height}px`;
  }

  function handle_page_scroll(scroll_event) {
    if (scroll_event.target !== option_menu) {
      update_option_menu_position();
    }
  }

  function add_option_menu_position_listeners() {
    window.addEventListener('resize', update_option_menu_position);
    window.addEventListener('scroll', handle_page_scroll, true);
    window.visualViewport?.addEventListener('resize', update_option_menu_position);
    window.visualViewport?.addEventListener('scroll', update_option_menu_position);
  }

  function remove_option_menu_position_listeners() {
    window.removeEventListener('resize', update_option_menu_position);
    window.removeEventListener('scroll', handle_page_scroll, true);
    window.visualViewport?.removeEventListener('resize', update_option_menu_position);
    window.visualViewport?.removeEventListener('scroll', update_option_menu_position);
  }

  function close_option_menu(restore_trigger_focus = false) {
    remove_option_menu_position_listeners();
    option_menu.hidden = true;
    option_menu.style.maxHeight = '';
    select_trigger.setAttribute('aria-expanded', 'false');
    select_wrapper.classList.remove('select-input--open', 'select-input--open-above');
    option_elements.forEach((option_element) => {
      option_element.classList.remove('select-input__option--active');
    });
    if (restore_trigger_focus) {
      select_trigger.focus();
    }
  }

  function open_option_menu() {
    if (native_select.disabled) {
      return;
    }

    option_menu.hidden = false;
    select_trigger.setAttribute('aria-expanded', 'true');
    select_wrapper.classList.add('select-input--open');
    update_option_menu_position();
    add_option_menu_position_listeners();
    window.requestAnimationFrame(() => focus_option(active_option_index));
  }

  function choose_option(option_index) {
    if (native_options[option_index]?.disabled) {
      return;
    }

    native_select.selectedIndex = option_index;
    native_select.dispatchEvent(new Event('change', { bubbles: true }));
    synchronize_selected_option();
    close_option_menu(true);
  }

  select_trigger.addEventListener('click', () => {
    if (option_menu.hidden) {
      open_option_menu();
    } else {
      close_option_menu(true);
    }
  });

  select_trigger.addEventListener('keydown', (keyboard_event) => {
    if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' '].includes(keyboard_event.key)) {
      keyboard_event.preventDefault();
      open_option_menu();
    }
  });

  option_elements.forEach((option_element, option_index) => {
    option_element.addEventListener('click', () => choose_option(option_index));
    option_element.addEventListener('keydown', (keyboard_event) => {
      if (keyboard_event.key === 'Escape') {
        keyboard_event.preventDefault();
        close_option_menu(true);
        return;
      }
      if (keyboard_event.key === 'Enter' || keyboard_event.key === ' ') {
        keyboard_event.preventDefault();
        choose_option(option_index);
        return;
      }
      if (keyboard_event.key === 'Tab') {
        close_option_menu();
        return;
      }

      let requested_index = option_index;
      if (keyboard_event.key === 'ArrowDown') {
        requested_index = next_enabled_option_index(option_elements, option_index, 1);
      } else if (keyboard_event.key === 'ArrowUp') {
        requested_index = next_enabled_option_index(option_elements, option_index, -1);
      } else if (keyboard_event.key === 'Home') {
        requested_index = next_enabled_option_index(option_elements, -1, 1);
      } else if (keyboard_event.key === 'End') {
        requested_index = next_enabled_option_index(option_elements, 0, -1);
      } else {
        return;
      }

      keyboard_event.preventDefault();
      focus_option(requested_index);
    });
  });

  select_wrapper.addEventListener('focusout', (focus_event) => {
    if (!select_wrapper.contains(focus_event.relatedTarget)) {
      close_option_menu();
    }
  });
  native_select.addEventListener('change', synchronize_selected_option);
  native_select.addEventListener('invalid', () => select_trigger.focus());
  native_select.form?.addEventListener('reset', () => {
    window.setTimeout(synchronize_selected_option);
  });
  native_select.parentNode.insertBefore(select_wrapper, native_select);
  select_wrapper.append(native_select, select_trigger, option_menu);
  native_select.tabIndex = -1;
  native_select.setAttribute('aria-hidden', 'true');
  synchronize_selected_option();
}

export function initialize_custom_selects(select_context) {
  select_context
    .querySelectorAll('select.form-select, select[data-jurenites-select]')
    .forEach((native_select) => enable_custom_select(native_select));
}

function tooltip_label_from_trigger(tooltip_trigger) {
  const data_icon_name = tooltip_trigger.getAttribute('data-icon-name');
  const raw_label = data_icon_name
    || tooltip_trigger.getAttribute('aria-label')
    || tooltip_trigger.getAttribute('data-tooltip-label')
    || tooltip_trigger.getAttribute('title');

  if (!raw_label) {
    return '';
  }

  if (data_icon_name) {
    return raw_label;
  }

  return raw_label
    .replace(/^\s+|\s+$/g, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^./, (first_character) => first_character.toUpperCase());
}

function position_tooltip(tooltip_trigger, tooltip_element) {
  const tooltip_document = tooltip_trigger.ownerDocument;
  const tooltip_window = tooltip_document.defaultView;
  const root_styles = tooltip_window.getComputedStyle(tooltip_document.documentElement);
  const trigger_bounds = tooltip_trigger.getBoundingClientRect();
  const tooltip_bounds = tooltip_element.getBoundingClientRect();
  const viewport_gap = Number.parseFloat(
    root_styles.getPropertyValue('--space-scale-base-gap'),
  );
  const requested_position = tooltip_trigger.dataset.tooltipPosition;
  const available_positions = {
    bottom: tooltip_window.innerHeight - trigger_bounds.bottom - viewport_gap >= tooltip_bounds.height,
    top: trigger_bounds.top - viewport_gap >= tooltip_bounds.height,
    right: tooltip_window.innerWidth - trigger_bounds.right - viewport_gap >= tooltip_bounds.width,
    left: trigger_bounds.left - viewport_gap >= tooltip_bounds.width,
  };
  const tooltip_position = requested_position && requested_position !== 'auto'
    ? requested_position
    : Object.keys(available_positions).find((position_name) => available_positions[position_name]) || 'bottom';
  const position_coordinates = {
    bottom: [trigger_bounds.left + (trigger_bounds.width - tooltip_bounds.width) / 2, trigger_bounds.bottom + viewport_gap],
    top: [trigger_bounds.left + (trigger_bounds.width - tooltip_bounds.width) / 2, trigger_bounds.top - tooltip_bounds.height - viewport_gap],
    right: [trigger_bounds.right + viewport_gap, trigger_bounds.top + (trigger_bounds.height - tooltip_bounds.height) / 2],
    left: [trigger_bounds.left - tooltip_bounds.width - viewport_gap, trigger_bounds.top + (trigger_bounds.height - tooltip_bounds.height) / 2],
  };
  const [left_coordinate, top_coordinate] = position_coordinates[tooltip_position] || position_coordinates.bottom;
  tooltip_element.dataset.tooltipPosition = tooltip_position;
  tooltip_element.style.left = `${Math.max(viewport_gap, Math.min(left_coordinate, tooltip_window.innerWidth - tooltip_bounds.width - viewport_gap))}px`;
  tooltip_element.style.top = `${Math.max(viewport_gap, Math.min(top_coordinate, tooltip_window.innerHeight - tooltip_bounds.height - viewport_gap))}px`;
}

export function initialize_tooltips(tooltip_context) {
  const tooltip_document = tooltip_context.nodeType === 9
    ? tooltip_context
    : tooltip_context.ownerDocument;
  tooltip_document.querySelectorAll('[data-jurenites-tooltip-overlay]').forEach((tooltip_overlay) => {
    if (!tooltip_overlay.jurenites_tooltip_trigger?.isConnected) {
      tooltip_overlay.remove();
    }
  });

  tooltip_context.querySelectorAll('[data-tooltip-trigger]').forEach((tooltip_trigger) => {
    if (tooltip_trigger.jurenites_tooltip_initialized) {
      return;
    }

    const tooltip_label = tooltip_label_from_trigger(tooltip_trigger);
    const tooltip_color_variant = tooltip_trigger.dataset.tooltipColorVariant;
    const tooltip_document = tooltip_trigger.ownerDocument;
    const tooltip_window = tooltip_document.defaultView;
    const root_styles = tooltip_window.getComputedStyle(tooltip_document.documentElement);
    const hide_delay = Number.parseFloat(
      root_styles.getPropertyValue('--motion-duration-short-default'),
    );
    const tooltip_element = tooltip_document.createElement('span');
    let hide_timer = 0;
    tooltip_element.className = tooltip_color_variant
      ? `tooltip tooltip--${tooltip_color_variant}`
      : 'tooltip tooltip--full-black';
    tooltip_element.dataset.jurenitesTooltipOverlay = '';
    tooltip_element.jurenites_tooltip_trigger = tooltip_trigger;
    tooltip_element.setAttribute('role', 'tooltip');
    tooltip_element.textContent = tooltip_label;
    tooltip_document.body.appendChild(tooltip_element);
    tooltip_trigger.setAttribute('aria-describedby', `tooltip-${Math.random().toString(36).slice(2)}`);
    tooltip_element.id = tooltip_trigger.getAttribute('aria-describedby');
    tooltip_trigger.jurenites_tooltip_initialized = true;
    tooltip_trigger.jurenites_tooltip_element = tooltip_element;

    const show_tooltip = () => {
      tooltip_window.clearTimeout(hide_timer);
      tooltip_element.classList.add('is-visible');
      position_tooltip(tooltip_trigger, tooltip_element);
    };
    const hide_tooltip = () => {
      tooltip_window.clearTimeout(hide_timer);
      tooltip_element.classList.remove('is-visible');
    };
    const schedule_tooltip_hide = () => {
      tooltip_window.clearTimeout(hide_timer);
      hide_timer = tooltip_window.setTimeout(hide_tooltip, hide_delay);
    };
    const reposition_visible_tooltip = () => {
      if (tooltip_element.classList.contains('is-visible')) {
        position_tooltip(tooltip_trigger, tooltip_element);
      }
    };
    tooltip_trigger.addEventListener('mouseenter', show_tooltip);
    tooltip_trigger.addEventListener('mouseleave', schedule_tooltip_hide);
    tooltip_trigger.addEventListener('focus', show_tooltip);
    tooltip_trigger.addEventListener('blur', schedule_tooltip_hide);
    tooltip_trigger.addEventListener('keydown', (keyboard_event) => {
      if (keyboard_event.key === 'Escape') {
        hide_tooltip();
      }
    });
    tooltip_element.addEventListener('mouseenter', show_tooltip);
    tooltip_element.addEventListener('mouseleave', schedule_tooltip_hide);
    tooltip_window.addEventListener('resize', reposition_visible_tooltip);
    tooltip_window.addEventListener('scroll', reposition_visible_tooltip, true);
  });
}

if (typeof Drupal !== 'undefined') {
  Drupal.behaviors.jurenites_media_loader_noise = {
    attach(context) {
      context.querySelectorAll('[data-jurenites-media-loader-noise]').forEach((noise_surface) => {
        if (noise_surface.jurenites_media_loader_initialized) {
          return;
        }

        noise_surface.jurenites_media_loader_initialized = true;
        create_media_loader_noise(noise_surface);
      });
    },
  };

  Drupal.behaviors.jurenites_article_back_link = {
    attach(context) {
      context.querySelectorAll('[data-jurenites-article-back]').forEach((back_link_element) => {
        if (back_link_element.jurenites_article_back_initialized) {
          return;
        }

        back_link_element.jurenites_article_back_initialized = true;
        enable_article_back_link(back_link_element);
      });
    },
  };

  Drupal.behaviors.jurenites_avatar_image_fallback = {
    attach(context) {
      initialize_avatar_images(context);
    },
  };

  Drupal.behaviors.jurenites_language_selector = {
    attach(context) {
      context.querySelectorAll('[data-jurenites-language-select]').forEach((language_select) => {
        if (language_select.jurenites_language_selector_initialized) {
          return;
        }

        language_select.jurenites_language_selector_initialized = true;
        enable_language_selector(language_select);
      });
    },
  };

  Drupal.behaviors.jurenites_custom_select = {
    attach(context) {
      initialize_custom_selects(context);
    },
  };
}
