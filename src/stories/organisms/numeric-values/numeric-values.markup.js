import { icon_markup } from '../../atoms/icon/icon.markup.js';
import numeric_values_template from "./numeric-values.template.html?raw";
import numeric_value_tile_template from "./numeric-value-tile.template.html?raw";
import { escape_html, render_template } from "../../template.js";

export function numeric_value_tile_markup({
  numeric_number,
  role_selector = null,
  numeric_description,
  numeric_icon_url = "",
  numeric_caption = "",
  numeric_caption_link_label = "",
  numeric_caption_link_url = "",
  numeric_link_label = "See more",
  numeric_link_url = "",
}) {
  const caption_is_external = /^(https?:)?\/\//i.test(numeric_caption_link_url);
  const caption_link_label = numeric_caption_link_label || numeric_caption_link_url;
  const caption_target_attributes = caption_is_external
    ? ` target="_blank" rel="external noopener noreferrer" aria-label="${escape_html(caption_link_label)} (opens in a new tab)"` : '';
  const caption_external_icon = caption_is_external ? icon_markup({
    icon_name: 'external-link',
    class_name: 'numeric-values__caption-external-mark',
  }) : '';
  return render_template(numeric_value_tile_template, {
    tile_class: role_selector ? ' role-slider__tile' : '',
    numeric_number_class: role_selector ? ' role-slider__number' : '',
    numeric_description: role_selector
      ? `<button class="numeric-values__description role-slider__tab" type="button" id="${escape_html(role_selector.button_id)}" aria-controls="${escape_html(role_selector.panel_id)}">${escape_html(numeric_description)}</button>`
      : `<p class="numeric-values__description">${escape_html(numeric_description)}</p>`,
    numeric_caption: numeric_caption || numeric_caption_link_url
      ? `<p class="numeric-values__caption">${escape_html(numeric_caption)}${numeric_caption_link_url ? ` <a class="numeric-values__caption-link" href="${escape_html(numeric_caption_link_url)}"${caption_target_attributes}><span>${escape_html(caption_link_label)}</span>${caption_external_icon}</a>` : ""}</p>`
      : "",
    numeric_icon: numeric_icon_url
      ? `<img class="numeric-values__icon" src="${escape_html(numeric_icon_url)}" alt="">`
      : "",
    numeric_number: escape_html(numeric_number),
    numeric_link: numeric_link_url
      ? `<a class="numeric-values__link" href="${escape_html(numeric_link_url)}">${escape_html(numeric_link_label)}</a>`
      : "",
  });
}

export function numeric_values_markup({ numeric_items, section_label }) {
  return render_template(numeric_values_template, {
    numeric_items: numeric_items.map(numeric_value_tile_markup).join(""),
    section_label: escape_html(section_label),
  });
}
