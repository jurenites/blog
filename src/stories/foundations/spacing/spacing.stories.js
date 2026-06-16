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
      const tile_label = token_name.replace("elevation-shadow-", "");
      return render_template(elevation_tile_template, {
        shadow_class: escape_html(`u-shadow-${token_name}`),
        label: escape_html(tile_label),
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
