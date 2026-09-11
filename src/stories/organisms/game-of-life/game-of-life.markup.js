import simulation_template from './game-of-life.template.html?raw';
import { button_markup } from '../../atoms/button/button.markup.js';
import { icon_markup } from '../../atoms/icon/icon.markup.js';
import { escape_html, render_template } from '../../template.js';

export function game_of_life_markup({ pause_label = 'Pause simulation', play_label = 'Play simulation', preview_size = 'detail' } = {}) {
  const pause_control = button_markup({
    button_label: '', button_accessible_label: pause_label, style_variant: 'ghost',
    additional_class_names: 'game-of-life__pause-button',
    button_icon_markup: icon_markup({ icon_name: 'pause-rect', class_name: 'game-of-life__pause-icon' })
      + icon_markup({ icon_name: 'play-triangle', class_name: 'game-of-life__play-icon' }),
  }).replace('<button ', `<button type="button" data-life-pause data-pause-label="${escape_html(pause_label)}" data-resume-label="${escape_html(play_label)}" aria-pressed="false" hidden `);
  const simulation_markup = render_template(simulation_template, { pause_control });
  return `<div class="game-of-life-preview game-of-life-preview--${preview_size === 'thumbnail' ? 'thumbnail' : 'detail'}">${simulation_markup}</div>`;
}
