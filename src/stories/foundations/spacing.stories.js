// Foundations: the 8px spacing scale and elevation shadows.
import token_map from "../../../generated/tokens/tokens.flat.json";
import spacing_template from "./spacing.template.html?raw";
import spacing_row_template from "./spacing-row.template.html?raw";
import elevation_tile_template from "./elevation-tile.template.html?raw";
import { escape_html, render_template } from "../template.js";

function spacing_rows() {
  return Object.entries(token_map)
    .filter(([token_name, token_data]) => token_name.startsWith("space-scale-") && token_data.type === "dimension")
    .map(([token_name, token_data]) => {
      const row_label = token_name.replace("space-scale-", "");
      return render_template(spacing_row_template, {
        label: escape_html(row_label),
        value: escape_html(token_data.css),
      });
    })
    .join("");
}

function elevation_rows() {
  return Object.entries(token_map)
    .filter(([token_name, token_data]) => token_name.startsWith("elevation-shadow-") && token_data.type === "shadow")
    .map(([token_name]) => {
      const tile_label = token_name.replace("elevation-shadow-", "");
      return render_template(elevation_tile_template, {
        variable: escape_html(token_name),
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
