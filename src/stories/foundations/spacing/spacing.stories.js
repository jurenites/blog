// Foundations: the 8px spacing scale and elevation shadows.
import spacing_template from "./spacing.template.html?raw";
import spacing_row_template from "./spacing-row.template.html?raw";
import elevation_tile_template from "./elevation-tile.template.html?raw";
import { escape_html, render_template } from "../../template.js";
import { token_names, token_value } from "../token-values.js";

function spacing_rows() {
  return token_names("space-scale-")
    .map((token_name) => {
      const row_label = token_name.replace("space-scale-", "");
      return render_template(spacing_row_template, {
        label: escape_html(row_label),
        value: escape_html(token_value(token_name)),
        width_class: escape_html(`u-width-${token_name}`),
      });
    })
    .join("");
}

function elevation_rows() {
  return token_names("elevation-shadow-")
    .map((token_name) => {
      const elevation_level = token_name.replace("elevation-shadow-", "");
      const surface_token_name = `color-surface-elevation-${elevation_level}`;

      return render_template(elevation_tile_template, {
        shadow_class: escape_html(`u-shadow-${token_name}`),
        surface_class: escape_html(`u-bg-${surface_token_name}`),
        elevation_label: escape_html(elevation_level),
        shadow_variable_name: escape_html(`--${token_name}`),
        surface_variable_name: escape_html(`--${surface_token_name}`),
      });
    })
    .join("");
}

function render_story() {
  return render_template(spacing_template, {
    spacingRows: spacing_rows(),
    elevationRows: elevation_rows(),
  });
}

export default {
  title: "Foundations/Spacing and Elevation",
  tags: ["autodocs"],
};

export const scale_story = { render: render_story };
