import chip_template from "./chip.template.html?raw";
import { escape_html, render_template } from "../../template.js";

export function chip_markup({ chip_label, is_accent = false }) {
  return render_template(chip_template, {
    modifier: is_accent ? " chip--accent" : "",
    label: escape_html(chip_label),
  });
}
