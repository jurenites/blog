import { chip_markup } from "../../atoms/chip/chip.markup.js";
import { escape_html, render_template } from "../../template.js";
import interest_tag_template from "./interest-tag.template.html?raw";
import interest_tags_template from "./interest-tags.template.html?raw";

export function interest_tag_markup({ interest_name, interest_url }) {
  return render_template(interest_tag_template, {
    interest_chip: chip_markup({
      chip_label: interest_name,
      chip_url: interest_url,
    }),
  });
}

export function interest_tags_markup({
  section_heading,
  section_description,
  interest_items,
}) {
  return render_template(interest_tags_template, {
    section_heading: escape_html(section_heading),
    section_description: escape_html(section_description),
    interest_items: interest_items.map(interest_tag_markup).join(""),
  });
}
