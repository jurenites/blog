import mapping_template from "./typography-mapping.template.html?raw";
import mapping_row_template from "./type-mapping-row.template.html?raw";
import { escape_html, render_template } from "../../template.js";
import { token_value, typography_role_names } from "../token-values.js";

function mapping_row_markup(role_name) {
  const token_name = `typography-${role_name}`;

  return render_template(mapping_row_template, {
    role_name: escape_html(role_name),
    token_name: escape_html(token_name),
    sample_class: escape_html(`u-typography-${role_name}`),
    sample_text: escape_html(role_name === "overline" ? "v0.1.10 · build" : "A personal journal about systems and craft"),
    font_shorthand: escape_html(token_value(token_name)),
  });
}

function render_story() {
  const typography_roles = typography_role_names();

  return render_template(mapping_template, {
    mapping_rows: typography_roles.map(mapping_row_markup).join(""),
  });
}

export default {
  title: "Foundations/Typography Mapping",
  tags: ["autodocs"],
  render: render_story,
};

export const default_story = {};
