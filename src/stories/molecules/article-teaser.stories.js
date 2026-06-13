// Molecule: Article Teaser. Eyebrow + title + excerpt + meta + read link.

function render({ eyebrow, title, excerpt, meta, linkLabel }) {
  return `
    <div class="storybook-stack" style="max-width: 640px;">
      <article class="article-teaser">
        <p class="article-teaser__eyebrow">${eyebrow}</p>
        <h2 class="article-teaser__title">${title}</h2>
        <p class="article-teaser__excerpt">${excerpt}</p>
        <div class="article-teaser__meta">${meta}</div>
        <a class="article-teaser__link" href="#">${linkLabel}</a>
      </article>
    </div>
  `;
}

export default {
  title: "Molecules/Article Teaser",
  tags: ["autodocs"],
  render,
  argTypes: {
    eyebrow: { control: "text" },
    title: { control: "text" },
    excerpt: { control: "text" },
    meta: { control: "text" },
    linkLabel: { control: "text" },
  },
  args: {
    eyebrow: "Writing",
    title: "Rewinding an Interface Through Time",
    excerpt: "How a time-slider concept turned into a repeatable design process.",
    meta: "Jun 2026 - 6 min read",
    linkLabel: "Read article",
  },
};

export const Default = {};
