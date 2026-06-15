// Foundations: the 8px spacing scale and elevation shadows.
import tokens from "../../../tokens/tokens.flat.json";
import template from "./spacing.template.html?raw";
import spacingRowTemplate from "./spacing-row.template.html?raw";
import elevationTileTemplate from "./elevation-tile.template.html?raw";
import { escapeHtml, renderTemplate } from "../template.js";

function spacingRows() {
  return Object.entries(tokens)
    .filter(([name, token]) => name.startsWith("space-scale-") && token.type === "dimension")
    .map(([name, token]) => {
      const label = name.replace("space-scale-", "");
      return renderTemplate(spacingRowTemplate, {
        label: escapeHtml(label),
        value: escapeHtml(token.css),
      });
    })
    .join("");
}

function elevationRows() {
  return Object.entries(tokens)
    .filter(([name, token]) => name.startsWith("elevation-shadow-") && token.type === "shadow")
    .map(([name]) => {
      const label = name.replace("elevation-shadow-", "");
      return renderTemplate(elevationTileTemplate, {
        variable: escapeHtml(name),
        label: escapeHtml(label),
      });
    })
    .join("");
}

function render() {
  return renderTemplate(template, {
    spacingRows: spacingRows(),
    elevationRows: elevationRows(),
  });
}

export default {
  title: "Foundations/Spacing and Elevation",
  tags: ["autodocs"],
};

export const Scale = { render };
