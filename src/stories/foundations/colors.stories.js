// Foundations: color tokens, rendered straight from tokens.flat.json so this page
// always matches the single source of truth.
import tokens from "../../../tokens/tokens.flat.json";
import template from "./colors.template.html?raw";
import swatchTemplate from "./color-swatch.template.html?raw";
import { escapeHtml, renderTemplate } from "../template.js";

function colorTokens() {
  return Object.entries(tokens)
    .filter(([name, token]) => token.type === "color" && name.startsWith("color-"))
    .map(([name, token]) => ({ name, value: token.css }));
}

function groupTitle(name) {
  const parts = name.split("-");
  return `${parts[1]} / ${parts.slice(2).join("-")}`;
}

function swatchMarkup({ name, value }) {
  return renderTemplate(swatchTemplate, {
    name: escapeHtml(groupTitle(name)),
    value: escapeHtml(value),
    variable: escapeHtml(name),
  });
}

function render() {
  return renderTemplate(template, {
    swatches: colorTokens().map(swatchMarkup).join(""),
  });
}

export default {
  title: "Foundations/Colors",
  tags: ["autodocs"],
};

export const Palette = { render };
