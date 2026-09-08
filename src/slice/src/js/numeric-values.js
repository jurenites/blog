const DIGIT_RADIX = 10;
const DRUM_STEP_COUNT = 10;
const NUMBER_GROUP_SIZE = 3;
const DEFAULT_DRUM_DURATION = 375;
const SLOT_MACHINE_TARGET_MINIMUM = 1000;
const COMPACT_COUNTER_CHARACTER_LIMIT = 5;

function grouped_digit_text(digit_text, grouping_separator) {
  if (!grouping_separator) {
    return digit_text;
  }

  return digit_text.replace(
    new RegExp(`\\B(?=(\\d{${NUMBER_GROUP_SIZE}})+(?!\\d))`, 'g'),
    grouping_separator,
  );
}

export function parse_numeric_counter_target(authored_number_text) {
  const trimmed_number_text = authored_number_text.trim();
  const numeric_text_match = trimmed_number_text.match(
    /^([^\d]*)(\d(?:[\d,\u00a0\u202f ]*\d)?)([^\d]*)$/u,
  );

  if (!numeric_text_match) {
    return null;
  }

  const [, prefix_text, numeric_text, suffix_text] = numeric_text_match;
  const target_digit_text = numeric_text.replace(/\D/g, '');
  const target_value = Number.parseInt(target_digit_text, DIGIT_RADIX);

  if (!Number.isSafeInteger(target_value) || target_value < 0) {
    return null;
  }

  return {
    grouping_separator: numeric_text.match(/[^\d]/u)?.[0] || '',
    prefix_text,
    suffix_text,
    target_value,
  };
}

export function parse_css_time_milliseconds(css_time_value) {
  const normalized_time_value = css_time_value.trim();
  const parsed_time_value = Number.parseFloat(normalized_time_value);

  if (!Number.isFinite(parsed_time_value) || parsed_time_value < 0) {
    return DEFAULT_DRUM_DURATION;
  }

  return normalized_time_value.endsWith('ms')
    ? parsed_time_value
    : parsed_time_value * 1000;
}

export function numeric_counter_uses_compact_size(authored_number_text) {
  return Array.from(authored_number_text.trim()).length > COMPACT_COUNTER_CHARACTER_LIMIT;
}

export function numeric_counter_frame(counter_value, target_details) {
  const bounded_counter_value = Math.min(
    target_details.target_value,
    Math.max(0, counter_value),
  );
  const current_whole_value = Math.floor(bounded_counter_value);
  const next_whole_value = Math.min(
    target_details.target_value,
    current_whole_value + 1,
  );
  const rolling_progress = bounded_counter_value - current_whole_value;
  const current_digit_text = String(current_whole_value);
  const grouped_number_text = grouped_digit_text(
    current_digit_text,
    target_details.grouping_separator,
  );
  let numeric_digit_index = 0;

  const display_characters = Array.from(grouped_number_text, (display_character) => {
    if (!/\d/.test(display_character)) {
      return {
        character_type: 'separator',
        display_character,
      };
    }

    const place_power = current_digit_text.length - numeric_digit_index - 1;
    const place_value = DIGIT_RADIX ** place_power;
    const current_digit = Math.floor(current_whole_value / place_value) % DIGIT_RADIX;
    const previous_digit = Math.floor(Math.max(0, current_whole_value - 1) / place_value)
      % DIGIT_RADIX;
    const next_digit = Math.floor(next_whole_value / place_value) % DIGIT_RADIX;
    const digit_is_rolling = next_digit !== current_digit;
    const drum_step = digit_is_rolling
      ? Math.min(DRUM_STEP_COUNT - 1, Math.floor(rolling_progress * DRUM_STEP_COUNT))
      : 0;

    numeric_digit_index += 1;

    return {
      character_type: 'digit',
      current_digit,
      drum_step,
      next_digit,
      previous_digit,
    };
  });

  return {
    display_characters,
    prefix_text: target_details.prefix_text,
    suffix_text: target_details.suffix_text,
  };
}

export function numeric_slot_frame(animation_progress, target_details) {
  const bounded_animation_progress = Math.min(1, Math.max(0, animation_progress));
  const target_digit_text = String(target_details.target_value);
  const grouped_number_text = grouped_digit_text(
    target_digit_text,
    target_details.grouping_separator,
  );
  let numeric_digit_index = 0;

  const display_characters = Array.from(grouped_number_text, (display_character) => {
    if (!/\d/.test(display_character)) {
      return {
        character_type: 'separator',
        display_character,
      };
    }

    const target_digit = Number.parseInt(display_character, DIGIT_RADIX);
    const full_rotation_count = numeric_digit_index + 3;
    const rolling_distance = (full_rotation_count * DIGIT_RADIX) + target_digit;
    const rolling_position = rolling_distance * bounded_animation_progress;
    const settled_digit = bounded_animation_progress === 1;
    const current_digit = settled_digit
      ? target_digit
      : Math.floor(rolling_position) % DIGIT_RADIX;
    const partial_rotation = rolling_position - Math.floor(rolling_position);
    const drum_step = settled_digit
      ? 0
      : Math.min(DRUM_STEP_COUNT - 1, Math.floor(partial_rotation * DRUM_STEP_COUNT));

    numeric_digit_index += 1;

    return {
      character_type: 'digit',
      current_digit,
      drum_step,
      next_digit: (current_digit + 1) % DIGIT_RADIX,
      previous_digit: (current_digit + DIGIT_RADIX - 1) % DIGIT_RADIX,
    };
  });

  return {
    display_characters,
    prefix_text: target_details.prefix_text,
    suffix_text: target_details.suffix_text,
  };
}

function create_static_character(counter_document, character_text, character_class) {
  const character_element = counter_document.createElement('span');
  character_element.className = character_class;
  character_element.textContent = character_text;
  return character_element;
}

function create_digit_face(counter_document, digit_value, position_name) {
  return create_static_character(
    counter_document,
    String(digit_value),
    `numeric-values__digit-face numeric-values__digit-face--${position_name}`,
  );
}

function create_digit_window(counter_document, digit_character) {
  const digit_window = counter_document.createElement('span');
  const digit_track = counter_document.createElement('span');

  digit_window.className = 'numeric-values__digit-window';
  digit_track.className = 'numeric-values__digit-track';
  digit_track.dataset.drumStep = String(digit_character.drum_step);
  digit_track.append(
    create_digit_face(counter_document, digit_character.previous_digit, 'previous'),
    create_digit_face(counter_document, digit_character.current_digit, 'current'),
    create_digit_face(counter_document, digit_character.next_digit, 'next'),
  );
  digit_window.appendChild(digit_track);

  return digit_window;
}

function render_numeric_counter_frame(number_element, counter_frame) {
  const counter_document = number_element.ownerDocument;
  const drum_element = counter_document.createElement('span');

  drum_element.className = 'numeric-values__drum';
  drum_element.setAttribute('aria-hidden', 'true');

  if (counter_frame.prefix_text) {
    drum_element.appendChild(create_static_character(
      counter_document,
      counter_frame.prefix_text,
      'numeric-values__affix numeric-values__affix--prefix',
    ));
  }

  counter_frame.display_characters.forEach((display_character) => {
    drum_element.appendChild(
      display_character.character_type === 'digit'
        ? create_digit_window(counter_document, display_character)
        : create_static_character(
          counter_document,
          display_character.display_character,
          'numeric-values__separator',
        ),
    );
  });

  if (counter_frame.suffix_text) {
    drum_element.appendChild(create_static_character(
      counter_document,
      counter_frame.suffix_text,
      'numeric-values__affix numeric-values__affix--suffix',
    ));
  }

  number_element.replaceChildren(drum_element);
}

function animate_numeric_counter(
  number_element,
  target_details,
  animation_duration,
  reduced_motion_query,
) {
  const counter_window = number_element.ownerDocument.defaultView;
  let animation_started_at;

  function render_animation_frame(current_time) {
    animation_started_at ??= current_time;

    const linear_progress = animation_duration === 0 || reduced_motion_query.matches
      ? 1
      : Math.min(1, (current_time - animation_started_at) / animation_duration);
    const remaining_progress = 1 - linear_progress;
    const eased_progress = 1 - (remaining_progress ** 3);
    const counter_frame = target_details.target_value >= SLOT_MACHINE_TARGET_MINIMUM
      ? numeric_slot_frame(eased_progress, target_details)
      : numeric_counter_frame(
        linear_progress === 1
          ? target_details.target_value
          : target_details.target_value * eased_progress,
        target_details,
      );

    render_numeric_counter_frame(number_element, counter_frame);

    if (linear_progress < 1) {
      number_element.jurenites_numeric_counter_animation = counter_window
        .requestAnimationFrame(render_animation_frame);
      return;
    }

    delete number_element.jurenites_numeric_counter_animation;
  }

  number_element.jurenites_numeric_counter_animation = counter_window
    .requestAnimationFrame(render_animation_frame);
}

export function initialize_numeric_value_counter(numeric_tile) {
  if (numeric_tile.jurenites_numeric_counter_initialized) {
    return;
  }

  const number_element = numeric_tile.querySelector('.numeric-values__number');
  const authored_number_text = number_element?.textContent || '';
  const target_details = parse_numeric_counter_target(authored_number_text);

  numeric_tile.jurenites_numeric_counter_initialized = true;

  if (!number_element || !target_details || target_details.target_value === 0) {
    return;
  }

  const counter_document = numeric_tile.ownerDocument;
  const counter_window = counter_document.defaultView;
  const reduced_motion_query = counter_window.matchMedia('(prefers-reduced-motion: reduce)');

  if (reduced_motion_query.matches) {
    return;
  }

  const root_styles = counter_window.getComputedStyle(counter_document.documentElement);
  const animation_duration = parse_css_time_milliseconds(
    root_styles.getPropertyValue('--motion-duration-long-default'),
  );

  number_element.setAttribute('aria-label', authored_number_text.trim());
  number_element.classList.toggle(
    'numeric-values__number--compact',
    numeric_counter_uses_compact_size(authored_number_text),
  );
  render_numeric_counter_frame(number_element, numeric_counter_frame(0, target_details));

  const start_counter_animation = () => {
    numeric_tile.jurenites_numeric_counter_observer?.disconnect();
    delete numeric_tile.jurenites_numeric_counter_observer;
    animate_numeric_counter(
      number_element,
      target_details,
      animation_duration,
      reduced_motion_query,
    );
  };

  if (!('IntersectionObserver' in counter_window)) {
    start_counter_animation();
    return;
  }

  const visibility_observer = new counter_window.IntersectionObserver((observer_entries) => {
    if (observer_entries.some((observer_entry) => observer_entry.isIntersecting)) {
      start_counter_animation();
    }
  }, {
    rootMargin: '0px 0px -10% 0px',
    threshold: 0.25,
  });

  numeric_tile.jurenites_numeric_counter_observer = visibility_observer;
  visibility_observer.observe(numeric_tile);
}

export function initialize_numeric_value_counters(counter_context) {
  const nested_numeric_tiles = Array.from(
    counter_context.querySelectorAll('.numeric-values__tile'),
  );
  const numeric_tiles = counter_context.matches?.('.numeric-values__tile')
    ? [counter_context, ...nested_numeric_tiles]
    : nested_numeric_tiles;

  numeric_tiles.forEach((numeric_tile) => {
    initialize_numeric_value_counter(numeric_tile);
  });
}
