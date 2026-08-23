import color_block_template from "./color-block.template.html?raw";
import { escape_html, render_template } from "../../template.js";

const COLOR_CHIP_SIZES = ["default", "compact"];

export function color_block_markup({
  background_token_name,
  foreground_token_name = "color-text-primary-default",
  chip_size = "default",
  chip_text = "",
  primary_text,
  secondary_text = "",
  tertiary_text = "",
}) {
  const resolved_chip_size = COLOR_CHIP_SIZES.includes(chip_size) ? chip_size : "default";

  return render_template(color_block_template, {
    chip_size: escape_html(resolved_chip_size),
    background_class: escape_html(`u-bg-${background_token_name}`),
    foreground_class: escape_html(`u-color-${foreground_token_name}`),
    chip_text: escape_html(chip_text),
    primary_text: escape_html(primary_text),
    secondary_text: escape_html(secondary_text),
    tertiary_text: escape_html(tertiary_text),
  });
}
