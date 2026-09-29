import { icon_markup } from '../../atoms/icon/icon.markup.js';
import { square_pagination_markup } from '../../molecules/square-pagination/square-pagination.markup.js';
import { escape_html } from '../../template.js';

export function screen_slider_markup({ screen_images }) {
  return `<section class="screen-slider" data-screen-slider role="region" aria-roledescription="carousel" aria-label="Interface screens">
    <div class="screen-slider__viewport" data-slider-viewport tabindex="0" aria-label="Screens. Use left and right arrow keys to navigate.">
      <div class="screen-slider__track" data-slider-track>${screen_images.map((screen_image, screen_index) => `<div class="screen-slider__screen" role="group" aria-roledescription="slide" aria-label="${screen_index + 1} / ${screen_images.length}"><img class="screen-slider__image" src="${escape_html(screen_image.image_url)}" alt="${escape_html(screen_image.image_alt)}" loading="lazy" decoding="async" draggable="false"></div>`).join('')}</div>
    </div>
    ${square_pagination_markup({ page_labels: screen_images.map((screen_image, screen_index) => `Show screen ${screen_index + 1} of ${screen_images.length}`), pagination_label: 'Screen pagination' })}
    <div class="screen-slider__controls"><button class="screen-slider__control" type="button" data-slider-previous aria-label="Previous screen">${icon_markup({ icon_name: 'arrow-left', class_name: 'screen-slider__control-icon screen-slider__control-icon--previous' })}</button><span data-slider-count>1 / ${screen_images.length}</span><button class="screen-slider__control" type="button" data-slider-next aria-label="Next screen">${icon_markup({ icon_name: 'arrow-left', class_name: 'screen-slider__control-icon screen-slider__control-icon--next' })}</button><button class="screen-slider__control screen-slider__control--toggle" type="button" data-slider-toggle data-pause-label="Pause" data-play-label="Play" aria-label="Pause" aria-pressed="false">${icon_markup({ icon_name: 'pause-rect', class_name: 'screen-slider__pause-icon' })}${icon_markup({ icon_name: 'play-triangle', class_name: 'screen-slider__play-icon' })}</button></div>
  </section>`;
}
