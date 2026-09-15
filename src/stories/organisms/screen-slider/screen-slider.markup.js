import { icon_markup } from '../../atoms/icon/icon.markup.js';
import { crossfade_dot_markup } from '../../atoms/crossfade-dot/crossfade-dot.markup.js';
import { escape_html } from '../../template.js';

export function screen_slider_markup({ screen_images }) {
  return `<section class="screen-slider" data-screen-slider role="region" aria-roledescription="carousel" aria-label="Interface screens">
    <div class="screen-slider__viewport" data-slider-viewport tabindex="0" aria-label="Screens. Use left and right arrow keys to navigate.">
      <div class="screen-slider__track" data-slider-track>${screen_images.map((screen_image, screen_index) => `<div class="screen-slider__screen" role="group" aria-roledescription="slide" aria-label="${screen_index + 1} / ${screen_images.length}"><img class="screen-slider__image" src="${escape_html(screen_image.image_url)}" alt="${escape_html(screen_image.image_alt)}" loading="lazy" decoding="async" draggable="false"></div>`).join('')}</div>
    </div>
    <div class="screen-slider__pagination" data-slider-pagination aria-label="Screen pagination">${screen_images.map((screen_image, screen_index) => crossfade_dot_markup({ dot_label: `Show screen ${screen_index + 1} of ${screen_images.length}`, is_active: screen_index === 0 }).replace('class="crossfade-dot', 'class="crossfade-dot screen-slider__dot').replace('type="button"', `type="button" data-slider-dot="${screen_index}"`)).join('')}</div>
    <div class="screen-slider__controls"><button class="screen-slider__control" type="button" data-slider-previous aria-label="Previous screen">${icon_markup({ icon_name: 'arrow-left', class_name: 'screen-slider__control-icon screen-slider__control-icon--previous' })}</button><span data-slider-count>1 / ${screen_images.length}</span><button class="screen-slider__control" type="button" data-slider-next aria-label="Next screen">${icon_markup({ icon_name: 'arrow-left', class_name: 'screen-slider__control-icon screen-slider__control-icon--next' })}</button><button class="screen-slider__control screen-slider__control--toggle" type="button" data-slider-toggle data-pause-label="Pause" data-play-label="Play" aria-label="Pause" aria-pressed="false">${icon_markup({ icon_name: 'pause-rect', class_name: 'screen-slider__pause-icon' })}${icon_markup({ icon_name: 'play-triangle', class_name: 'screen-slider__play-icon' })}</button></div>
  </section>`;
}
