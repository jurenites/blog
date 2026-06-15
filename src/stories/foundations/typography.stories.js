// Foundations: Material M2 type scale, driven by the typography role tokens.
import tokens from "../../../tokens/tokens.flat.json";
import template from "./typography.template.html?raw";
import rowTemplate from "./type-row.template.html?raw";
import { escapeHtml, renderTemplate } from "../template.js";

const ROLES = [
  "headline-1",
  "headline-2",
  "headline-3",
  "headline-4",
  "headline-5",
  "headline-6",
  "subtitle-1",
  "subtitle-2",
  "body-1",
  "body-2",
  "button-label",
  "caption-default",
  "overline-default",
];

function roleStyle(role) {
  const size = tokens[`typography-${role}-font-size`];
  const weight = tokens[`typography-${role}-font-weight`];
  const spacing = tokens[`typography-${role}-letter-spacing`];
  const lineHeight = tokens[`typography-${role}-line-height`];
  const transform = tokens[`typography-${role}-text-transform`];
  const declarations = [
    `font-family: var(--typography-${role}-font-family)`,
    `font-size: ${size ? size.css : "1rem"}`,
    `font-weight: ${weight ? weight.css : "400"}`,
    `letter-spacing: ${spacing ? spacing.css : "0"}`,
    `line-height: ${lineHeight ? lineHeight.css : "1.5"}`,
  ];
  if (transform) {
    declarations.push(`text-transform: ${transform.css}`);
  }
  return declarations.join(";");
}

function rowMarkup(role) {
  const size = tokens[`typography-${role}-font-size`];
  return renderTemplate(rowTemplate, {
    style: escapeHtml(roleStyle(role)),
    sample: escapeHtml(`${role} - The quick brown fox`),
    meta: escapeHtml(`${role} / ${size ? size.css : ""}`),
  });
}

function render() {
  return renderTemplate(template, { rows: ROLES.map(rowMarkup).join("") });
}

export default {
  title: "Foundations/Typography",
  tags: ["autodocs"],
};

export const TypeScale = { render };
