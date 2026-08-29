import chip_template from "./chip.template.html?raw";
import chip_link_template from "./chip-link.template.html?raw";
import { escape_html, render_template } from "../../template.js";

export function chip_markup({ chip_label, chip_url = "", is_accent = false }) {
  const selected_template = chip_url ? chip_link_template : chip_template;

  return render_template(selected_template, {
    class_name: is_accent ? " chip--accent" : "",
    chip_label_text: escape_html(chip_label),
    chip_url_text: escape_html(chip_url),
  });
}
