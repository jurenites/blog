import phone_template from './phone-preview.template.html?raw';
import { escape_html, render_template } from '../../template.js';

let card_sequence = 0;

function frame_media_markup(frame_item) {
  if (frame_item.frame_mode === 'video') {
    return `<video class="card__video${frame_item.video_fit === 'cover' ? ' card__video--cover' : ''}" src="${escape_html(frame_item.video_source)}" aria-label="${escape_html(frame_item.image_description)}" muted playsinline preload="auto" ${frame_item.poster_source ? `poster="${escape_html(frame_item.poster_source)}"` : ''}></video>`;
  }
  if (frame_item.frame_mode === 'gif') {
    const frame_width = Math.max(1, Number(frame_item.gif_frame_width) || 375);
    const frame_height = Math.max(1, Number(frame_item.gif_frame_height) || 667);
    const frame_durations = (Array.isArray(frame_item.gif_frame_durations) ? frame_item.gif_frame_durations : [100]).map((frame_duration) => Math.max(10, Number(frame_duration) || 100));
    const sprite_width = frame_width * frame_durations.length;
    const sprite_image = `<image href="${escape_html(frame_item.gif_sprite_source)}" width="${sprite_width}" height="${frame_height}"></image>`;
    return `<svg class="card__gif" viewBox="0 0 ${frame_width} ${frame_height}" role="img" aria-label="${escape_html(frame_item.image_description)}" data-gif-frames="${escape_html(JSON.stringify(frame_durations))}" data-gif-width="${frame_width}" data-gif-height="${frame_height}">${sprite_image}</svg>
      <svg class="card__edge-fill" viewBox="0 ${frame_height - 1} ${frame_width} 1" preserveAspectRatio="none" aria-hidden="true" data-gif-edge>${sprite_image}</svg>`;
  }
  return `<img class="card__image" src="${escape_html(frame_item.image_source)}" alt="${escape_html(frame_item.image_description)}" loading="eager" draggable="false">
    <svg class="card__edge-fill" preserveAspectRatio="none" aria-hidden="true" focusable="false" data-screen-edge-fill><image href="${escape_html(frame_item.image_source)}"></image></svg>`;
}

function island_overlay_markup(screen_width, screen_height, overlay_enabled, image_source = '') {
  if (!overlay_enabled) return '';
  const screen_center = screen_width / 2;
  return `<svg class="card__island-overlay" viewBox="0 0 ${screen_width} ${screen_height}" aria-hidden="true" focusable="false">
    <rect class="card__island-surface" width="${screen_width}" height="56"></rect>
    ${image_source ? `<svg class="card__island-pixels" width="${screen_width}" height="56" viewBox="0 0 ${screen_width} 1" preserveAspectRatio="none" data-screen-top-fill><image href="${escape_html(image_source)}"></image></svg>` : ''}
    <rect class="card__camera-island" x="${screen_center - 55}" y="12" width="110" height="30" rx="15"></rect>
    <circle class="card__camera-ring" cx="${screen_center + 37}" cy="27" r="6"></circle>
    <circle class="card__camera-lens" cx="${screen_center + 37}" cy="27" r="3"></circle>
  </svg>`;
}

export function phone_preview_markup(card_arguments) {
  const screen_preset = card_arguments.screen_preset === 'large-screen' ? 'large-screen' : 'compact-screen';
  const iphone_era = card_arguments.iphone_era === 'classic' ? 'classic' : 'modern';
  const is_classic = iphone_era === 'classic';
  const screen_width = screen_preset === 'large-screen' ? 414 : 375;
  const screen_height = is_classic ? (screen_preset === 'large-screen' ? 736 : 667) : (screen_preset === 'large-screen' ? 896 : 812);
  const device_width = screen_width + (is_classic ? 44 : 24);
  const device_height = screen_height + (is_classic ? 140 : 24);
  const device_center = device_width / 2;
  const gradient_identifier = `card-background-${++card_sequence}`;
  const template_arguments = Object.fromEntries(
    Object.entries(card_arguments).map(([argument_name, argument_value]) => [argument_name, escape_html(argument_value)]),
  );
  const frame_items = Array.isArray(card_arguments.frame_list) ? card_arguments.frame_list : [];
  const fallback_source = card_arguments.fallback_source || frame_items.find((frame_item) => frame_item.image_source)?.image_source
    || frame_items.find((frame_item) => frame_item.poster_source)?.poster_source;
  const default_overlay = !is_classic && card_arguments.island_overlay !== false;
  const poster_frame = frame_items.find((frame_item) => frame_item.image_source === fallback_source || frame_item.poster_source === fallback_source);
  const poster_overlay = !is_classic && (poster_frame?.island_overlay ?? default_overlay);
  const poster_markup = fallback_source
    ? `<span class="card__poster${poster_overlay ? ' card__frame--island-inset' : ''}"><span class="card__frame-media"><img class="card__poster-image" src="${escape_html(fallback_source)}" alt="" loading="eager" draggable="false"></span>${island_overlay_markup(screen_width, screen_height, poster_overlay, fallback_source)}</span>` : '';
  const depth_markup = card_arguments.follow_cursor === false ? '' : Array.from({ length: 8 }, (unused_value, depth_index) =>
    `<span class="card__device-depth card__device-depth--slice-${depth_index + 1}${depth_index === 7 ? ' card__device-depth--back' : ''}" aria-hidden="true"></span>`).join('');
  const screen_frames = frame_items.map((frame_item, frame_index) => `
    <span class="card__frame${!is_classic && (frame_item.island_overlay ?? default_overlay) && !['scroll', 'video', 'gif'].includes(frame_item.frame_mode) ? ' card__frame--island-inset' : ''}" data-screen-frame ${frame_index === 0 ? 'data-frame-active' : ''}
      data-hold-duration="${escape_html(frame_item.hold_ms ?? (frame_item.frame_mode === 'video' ? 0 : 2000))}"
      data-frame-mode="${['scroll', 'video', 'gif'].includes(frame_item.frame_mode) ? frame_item.frame_mode : 'still'}"
      data-scroll-behavior="${frame_item.scroll_behavior === 'swipe' ? 'swipe' : 'continuous'}"
      data-scroll-start="${frame_item.scroll_start === 'bottom' ? 'bottom' : 'top'}"
      data-scroll-speed="${escape_html(frame_item.scroll_speed ?? 70)}"
      data-bottom-duration="${escape_html(frame_item.bottom_hold_ms ?? 800)}"><span class="card__frame-media">${frame_media_markup(frame_item)}</span>${island_overlay_markup(screen_width, screen_height, !is_classic && (frame_item.island_overlay ?? default_overlay), frame_item.image_source || frame_item.poster_source)}</span>`).join('');
  const hardware_markup = is_classic
    ? `<rect class="card__camera-island" x="${device_center - 24}" y="34" width="48" height="6" rx="3"></rect>
       <circle class="card__camera-ring" cx="${device_center - 44}" cy="37" r="5"></circle>
       <circle class="card__camera-lens" cx="${device_center - 44}" cy="37" r="2"></circle>
       <circle class="card__home-button" cx="${device_center}" cy="${device_height - 35}" r="22" stroke="url(#${gradient_identifier}-metal)"></circle>`
    : `<rect class="card__gesture-bar" x="${device_center - 60}" y="${device_height - 26}" width="120" height="5" rx="2.5"></rect>`;
  return render_template(phone_template, {
    ...template_arguments, screen_preset, iphone_era, screen_frames, hardware_markup, poster_markup, depth_markup,
    poster_class: poster_markup ? 'card__screen--with-poster' : '',
    reflection_identifier: `${gradient_identifier}-reflection`,
    metal_identifier: `${gradient_identifier}-metal`,
    shadow_identifier: `${gradient_identifier}-shadow`,
    device_width, device_height,
    body_width: device_width - 8, body_height: device_height - 4,
    glass_width: device_width - 16, glass_height: device_height - 16,
    button_right: device_width - 5,
  });
}
