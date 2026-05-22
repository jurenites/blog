import "./timeline.css";

const events = [
  {
    year: "2010",
    title: "First PHP work",
    body: "Early backend and data-structure work that later shaped the CMS direction."
  },
  {
    year: "2011",
    title: "First solo Drupal project",
    body: "A practical point where Drupal became a real tool, not just another CMS."
  },
  {
    year: "2018",
    title: "Nokia Drupal 8 firefighting",
    body: "Short, intense bug-fixing work before a large public release."
  },
  {
    year: "2020+",
    title: "Accountia design system work",
    body: "Long-running UI, product, guideline, and implementation review work."
  }
];

function timelineMarkup(items = events) {
  return `
    <main class="storybook-shell">
      <section class="timeline-preview" aria-label="Work timeline preview">
        <header class="timeline-preview__header">
          <p class="timeline-preview__eyebrow">Work Timeline</p>
          <h1>Career bookmarks as a slider-ready story</h1>
        </header>
        <ol class="timeline-preview__rail">
          ${items
            .map(
              (item) => `
                <li class="timeline-preview__event">
                  <span class="timeline-preview__marker" aria-hidden="true"></span>
                  <time>${item.year}</time>
                  <h2>${item.title}</h2>
                  <p>${item.body}</p>
                </li>
              `
            )
            .join("")}
        </ol>
      </section>
    </main>
  `;
}

export default {
  title: "Components/Timeline",
  tags: ["autodocs"]
};

export const TimelinePreview = {
  render: () => timelineMarkup()
};
