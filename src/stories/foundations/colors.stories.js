// Foundations: color tokens, rendered straight from tokens.flat.json so this page
// always matches the single source of truth.
import tokens from "../../../tokens/tokens.flat.json";

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
  return `
    <figure class="swatch">
      <div class="swatch__chip" style="background:${value}"></div>
      <figcaption class="swatch__caption">
        <span class="swatch__name">${groupTitle(name)}</span>
        <code class="swatch__value">${value}</code>
        <code class="swatch__var">--${name}</code>
      </figcaption>
    </figure>
  `;
}

function render() {
  return `
    <style>
      .swatch { margin: 0; }
      .swatch__chip {
        height: 72px;
        border-radius: var(--shape-corner-radius-small-default);
        border: var(--space-scale-hairline) solid var(--color-border-subtle-default);
      }
      .swatch__caption { display: flex; flex-direction: column; gap: 2px; padding-top: 8px; }
      .swatch__name { color: var(--color-text-primary-default); text-transform: capitalize; }
      .swatch__value, .swatch__var { color: var(--color-text-secondary-default); font-size: 12px; }
    </style>
    <main class="storybook-grid">
      ${colorTokens().map(swatchMarkup).join("")}
    </main>
  `;
}

export default {
  title: "Foundations/Colors",
  tags: ["autodocs"],
};

export const Palette = { render };
