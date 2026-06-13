// Foundations: the 8px spacing scale and elevation shadows.
import tokens from "../../../tokens/tokens.flat.json";

function spacingRows() {
  return Object.entries(tokens)
    .filter(([name, token]) => name.startsWith("space-scale-") && token.type === "dimension")
    .map(([name, token]) => {
      const label = name.replace("space-scale-", "");
      return `
        <div class="space-row">
          <code class="space-row__name">${label}</code>
          <code class="space-row__value">${token.css}</code>
          <span class="space-row__bar" style="width:${token.css}"></span>
        </div>
      `;
    })
    .join("");
}

function elevationRows() {
  return Object.entries(tokens)
    .filter(([name, token]) => name.startsWith("elevation-shadow-") && token.type === "shadow")
    .map(([name]) => {
      const label = name.replace("elevation-shadow-", "");
      return `<div class="elevation-tile" style="box-shadow: var(--${name})">${label}</div>`;
    })
    .join("");
}

function render() {
  return `
    <style>
      .space-row { display: flex; align-items: center; gap: var(--space-scale-medium-default); padding: 6px 0; }
      .space-row__name { width: 120px; color: var(--color-text-primary-default); }
      .space-row__value { width: 64px; color: var(--color-text-secondary-default); font-size: 12px; }
      .space-row__bar { height: 16px; background: var(--color-action-primary-default); border-radius: 2px; }
      .elevation-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: var(--space-scale-large-default); }
      .elevation-tile { display: flex; align-items: center; justify-content: center; height: 96px; background: var(--color-surface-panel-raised); border-radius: var(--shape-corner-radius-medium-default); color: var(--color-text-secondary-default); }
    </style>
    <main class="storybook-stack">
      <section>
        <h3>Spacing scale (8px grid)</h3>
        ${spacingRows()}
      </section>
      <section>
        <h3>Elevation shadows</h3>
        <div class="elevation-grid">${elevationRows()}</div>
      </section>
    </main>
  `;
}

export default {
  title: "Foundations/Spacing and Elevation",
  tags: ["autodocs"],
};

export const Scale = { render };
