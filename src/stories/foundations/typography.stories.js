// Foundations: Material M2 type scale, driven by the typography role tokens.
import tokens from "../../../tokens/tokens.flat.json";

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
  return `
    <div class="type-row">
      <p class="type-row__sample" style="${roleStyle(role)}">${role} - The quick brown fox</p>
      <code class="type-row__meta">${role} / ${size ? size.css : ""}</code>
    </div>
  `;
}

function render() {
  return `
    <style>
      .type-row { padding: var(--space-scale-medium-default) 0; border-bottom: var(--space-scale-hairline) solid var(--color-border-subtle-default); }
      .type-row__sample { margin: 0; color: var(--color-text-primary-default); }
      .type-row__meta { color: var(--color-text-secondary-default); font-size: 12px; }
    </style>
    <main class="storybook-stack">
      ${ROLES.map(rowMarkup).join("")}
    </main>
  `;
}

export default {
  title: "Foundations/Typography",
  tags: ["autodocs"],
};

export const TypeScale = { render };
