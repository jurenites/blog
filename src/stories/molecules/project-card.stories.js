// Molecule: Project Card. Composes chip + button atoms.

function render({ title, excerpt, tags, showMedia, actionLabel }) {
  const tagList = String(tags)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => `<span class="chip">${tag}</span>`)
    .join("");

  const media = showMedia
    ? `<div class="project-card__media"></div>`
    : "";

  return `
    <div class="storybook-stack" style="max-width: 360px;">
      <article class="project-card">
        ${media}
        <div class="project-card__body">
          <h3 class="project-card__title">${title}</h3>
          <p class="project-card__excerpt">${excerpt}</p>
          <div class="project-card__tag-list">${tagList}</div>
          <div class="project-card__actions">
            <button class="button button--secondary">${actionLabel}</button>
          </div>
        </div>
      </article>
    </div>
  `;
}

export default {
  title: "Molecules/Project Card",
  tags: ["autodocs"],
  render,
  argTypes: {
    title: { control: "text" },
    excerpt: { control: "text" },
    tags: { control: "text" },
    showMedia: { control: "boolean" },
    actionLabel: { control: "text" },
  },
  args: {
    title: "Interactive CV Timeline",
    excerpt: "A slider-driven career story with company logos and bookmarks.",
    tags: "Drupal, Figma, WebGL",
    showMedia: true,
    actionLabel: "View project",
  },
};

export const Default = {};
