import font_preview_template from "./font-preview.template.html?raw";
import { button_link_markup, button_markup } from "../../atoms/button/button.markup.js";
import { icon_markup } from "../../atoms/icon/icon.markup.js";
import { text_input_markup } from "../../atoms/text-input/text-input.markup.js";
import { escape_html, render_template } from "../../template.js";

export function font_preview_markup({
  before_data_content = "",
  component_id,
  font_identifier,
  font_title,
  font_url,
  download_filename,
  sample_text,
}) {
  const safe_component_id = escape_html(component_id);
  return render_template(font_preview_template, {
    before_data_content,
    close_action: button_markup({
      button_label: "Close",
      style_variant: "ghost",
      additional_class_names: "font-preview__dialog-close",
    }).replace("<button ", '<button type="button" data-font-preview-close '),
    component_id: safe_component_id,
    download_action: button_link_markup({
      button_label: "Download font",
      link_url: font_url,
      download_filename,
      style_variant: "secondary",
      additional_class_names: "font-preview__download",
      button_icon_markup: icon_markup({ icon_name: "arrow-download" }),
    }),
    font_identifier: escape_html(font_identifier),
    font_title: escape_html(font_title),
    font_url: escape_html(font_url),
    more_glyphs_toggle: button_markup({
      button_label: "More glyphs",
      style_variant: "ghost",
      additional_class_names: "font-preview__more-toggle",
      button_icon_markup: icon_markup({
        icon_name: "chevron-down",
        class_name: "font-preview__more-icon",
      }),
    }).replace(
      "<button ",
      `<button type="button" id="${safe_component_id}-additional-glyphs-toggle" data-font-preview-additional-toggle aria-expanded="false" aria-controls="${safe_component_id}-additional-glyphs" hidden `,
    ),
    path_data_toggle: button_markup({
      button_label: "",
      style_variant: "ghost",
      additional_class_names: "font-preview__path-toggle",
      button_icon_markup: icon_markup({
        icon_name: "chevron-down",
        class_name: "font-preview__path-icon",
      }),
    }).replace(
      "<button ",
      `<button type="button" data-font-preview-path-toggle aria-expanded="false" aria-controls="${safe_component_id}-glyph-path" aria-label="Show path data" data-path-show-label="Show path data" data-path-hide-label="Hide path data" `,
    ),
    text_input: text_input_markup({
      input_id: `${component_id}-input`,
      input_label: "Try it yourself",
      input_name: `${font_identifier}_sample_text`,
      input_placeholder: "Type with this font",
      input_value: sample_text,
    }),
  });
}
