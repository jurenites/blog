// Storybook consumes the same compiled design system as the Drupal theme:
// src/slice/src/scss/main.scss is the single CSS source of truth.
import "../src/slice/src/scss/main.scss";
import "../src/styles/storybook.scss";
import { TOKEN_VALUES } from "../generated/token/tokens.js";
import { version_watermark_markup } from "../src/stories/atoms/version-watermark/version-watermark.markup.js";

function token_dimension(token_name) {
  return TOKEN_VALUES[token_name];
}

// Custom viewports mirror the breakpoint tokens. Desktop ends at the maximum
// tested Full HD viewport; larger screens retain desktop behavior.
const breakpoint_viewports = {
  mobile_min: {
    name: "Mobile min (360px)",
    styles: { width: token_dimension("system-breakpoint-mobile-min"), height: "780px" },
    type: "mobile",
  },
  mobile_max: {
    name: "Mobile max (640px)",
    styles: { width: token_dimension("system-breakpoint-mobile-max"), height: "900px" },
    type: "mobile",
  },
  tablet_min: {
    name: "Tablet min (641px)",
    styles: { width: token_dimension("system-breakpoint-tablet-min"), height: "1112px" },
    type: "tablet",
  },
  desktop_min: {
    name: "Desktop min (1280px)",
    styles: { width: token_dimension("system-breakpoint-desktop-min"), height: "832px" },
    type: "desktop",
  },
  desktop_max: {
    name: "Desktop max (1920px)",
    styles: { width: token_dimension("system-breakpoint-desktop-max"), height: "1080px" },
    type: "desktop",
  },
};

function render_version_watermark(story_function) {
  const build_info = globalThis.STORYBOOK_BUILD_INFO;
  const story_markup = story_function();

  if (!build_info) {
    return story_markup;
  }

  const watermark_markup = version_watermark_markup({
    version_label: "Version",
    version_number: build_info.project_version,
    updated_gmt: build_info.created_gmt,
    git_hash: build_info.commit_hash,
    git_url: build_info.commit_url,
    credit_text: `made by ${build_info.collaboration_credit}`,
  });

  if (typeof story_markup === "string") {
    return `${story_markup}${watermark_markup}`;
  }

  const story_container = document.createElement("div");
  story_container.className = "storybook-decorated-screen";
  story_container.append(story_markup);
  story_container.insertAdjacentHTML("beforeend", watermark_markup);
  return story_container;
}

export const decorators = [render_version_watermark];

export const parameters = {
  layout: "fullscreen",
  backgrounds: { disable: true },
  viewport: {
    viewports: breakpoint_viewports,
  },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/i,
    },
  },
  options: {
    storySort: {
      order: ["Foundations", "Atoms", "Molecules", "Organisms", "Components"],
    },
  },
};
