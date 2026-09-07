import scene_template from './layered-scene.template.html?raw';
import { button_link_markup } from '../../atoms/button/button.markup.js';
import { escape_html, render_template } from '../../template.js';

export function layered_scene_markup({ section_heading, eyebrow_heading, section_description, background_image_url, background_description, foreground_image_url, foreground_description, arrival_enabled, primary_label, primary_url, secondary_label, secondary_url }) {
  const action_markup = [[primary_label, primary_url, 'primary'], [secondary_label, secondary_url, 'secondary']]
    .filter(([button_label, link_url]) => button_label && link_url)
    .map(([button_label, link_url, style_variant]) => button_link_markup({ button_label, link_url, style_variant, additional_class_names: 'layered-scene__action' })).join('');
  const foreground_markup = foreground_image_url ? `<img class="layered-scene__foreground" src="${escape_html(foreground_image_url)}" alt="${escape_html(foreground_description)}" decoding="async">` : '';
  return render_template(scene_template, {
    additional_classes: background_image_url ? '' : ' layered-scene--without-image',
    arrival_enabled: arrival_enabled ? 'true' : 'false',
    section_label: escape_html(section_heading),
    section_heading: escape_html(section_heading),
    scene_markup: background_image_url ? `<div class="layered-scene__frame"><img class="layered-scene__background" src="${escape_html(background_image_url)}" alt="${escape_html(background_description)}" decoding="async">${foreground_markup}</div>` : '',
    eyebrow_markup: eyebrow_heading ? `<p class="layered-scene__eyebrow">${escape_html(eyebrow_heading)}</p>` : '',
    description_markup: section_description ? `<p class="layered-scene__description">${escape_html(section_description)}</p>` : '',
    actions_markup: action_markup ? `<div class="layered-scene__actions">${action_markup}</div>` : '',
  });
}
