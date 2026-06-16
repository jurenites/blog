// Foundations: loaded font families, including custom SMEP fonts.
import font_page_template from "./fonts.template.html?raw";
import font_row_template from "./font-row.template.html?raw";
import { escape_html, render_template } from "../template.js";

const font_family_rows = [
  {
    font_label: "Open Sans / base",
    font_family: "var(--typography-font-family-sans-default)",
    font_size: "28px",
    sample_text: "Open Sans is the default interface and body font.",
  },
  {
    font_label: "Roundabout / custom display",
    font_family: "var(--typography-font-family-roundabout-display)",
    font_size: "28px",
    sample_text: "Roundabout brings a custom display voice.",
  },
  {
    font_label: "4pixel / custom pixel",
    font_family: "var(--typography-font-family-pixel-display)",
    font_size: "5px",
    sample_text: "4pixel works for compact technical labels.",
  },
];

function font_row_markup(font_family_item) {
  return render_template(font_row_template, {
    font_label: escape_html(font_family_item.font_label),
    font_family: escape_html(font_family_item.font_family),
    font_size: escape_html(font_family_item.font_size),
    sample_text: escape_html(font_family_item.sample_text),
  });
}

function render_story() {
  return render_template(font_page_template, {
    font_rows: font_family_rows.map(font_row_markup).join(""),
  });
}

export default {
  title: "Foundations/Fonts",
  tags: ["autodocs"],
};

export const font_family_story = { render: render_story };
