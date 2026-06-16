// Foundations: WCAG contrast matrix, calculated from the raw palette color tokens.
import contrast_template from "./color-contrast.template.html?raw";
import { escape_html, render_template } from "../../template.js";
import { token_names, token_value } from "../token-values.js";

function palette_tokens() {
  return token_names("color-palette-")
    .map((token_name) => ({
      token_name,
      token_label: token_name.replace("color-palette-", ""),
      token_value: token_value(token_name),
    }));
}

function rgb_channel(linear_value) {
  const channel_value = linear_value / 255;
  if (channel_value <= 0.03928) {
    return channel_value / 12.92;
  }
  return ((channel_value + 0.055) / 1.055) ** 2.4;
}

function color_luminance(color_value) {
  const hex_value = color_value.replace("#", "").slice(0, 6);
  const red_value = Number.parseInt(hex_value.slice(0, 2), 16);
  const green_value = Number.parseInt(hex_value.slice(2, 4), 16);
  const blue_value = Number.parseInt(hex_value.slice(4, 6), 16);
  return 0.2126 * rgb_channel(red_value) + 0.7152 * rgb_channel(green_value) + 0.0722 * rgb_channel(blue_value);
}

function contrast_ratio(foreground_value, background_value) {
  const foreground_light = color_luminance(foreground_value);
  const background_light = color_luminance(background_value);
  const light_value = Math.max(foreground_light, background_light);
  const dark_value = Math.min(foreground_light, background_light);
  return (light_value + 0.05) / (dark_value + 0.05);
}

function contrast_grade(ratio_value) {
  if (ratio_value >= 7) {
    return "AAA";
  }
  if (ratio_value >= 4.5) {
    return "AA";
  }
  return "F";
}

function header_cell_markup(color_token) {
  return `<th scope="col">
    <code class="contrast-token">${escape_html(color_token.token_label)}</code>
    <code class="contrast-value">${escape_html(color_token.token_value)}</code>
  </th>`;
}

function body_cell_markup(text_token, background_token) {
  const ratio_value = contrast_ratio(text_token.token_value, background_token.token_value);
  const grade_value = contrast_grade(ratio_value);
  const grade_class = grade_value === "AAA" ? "aaa" : grade_value === "AA" ? "aa" : "fail";
  const background_class = escape_html(`u-bg-${background_token.token_name}`);
  const foreground_class = escape_html(`u-color-${text_token.token_name}`);
  return `<td class="contrast-cell ${background_class} ${foreground_class}">
    <span class="contrast-cell__grade contrast-cell__grade--${grade_class}">${grade_value}</span>
    <span class="contrast-cell__ratio">${ratio_value.toFixed(2)}</span>
  </td>`;
}

function body_row_markup(background_token, text_tokens) {
  const row_cells = text_tokens.map((text_token) => body_cell_markup(text_token, background_token)).join("");
  return `<tr>
    <th class="contrast-table__row-heading" scope="row">
      <code class="contrast-token">${escape_html(background_token.token_label)}</code>
      <code class="contrast-value">${escape_html(background_token.token_value)}</code>
    </th>
    ${row_cells}
  </tr>`;
}

function render_contrast_story() {
  const color_tokens = palette_tokens();
  return render_template(contrast_template, {
    header_cells: color_tokens.map(header_cell_markup).join(""),
    body_rows: color_tokens.map((background_token) => body_row_markup(background_token, color_tokens)).join(""),
  });
}

export default {
  title: "Foundations/Colors/Color Contrast",
  tags: ["autodocs"],
};

export const default_story = {
  name: "Default story",
  render: render_contrast_story,
};
