// Storybook consumes the same compiled design system as the Drupal theme:
// src/slice/src/scss/main.scss is the single CSS source of truth.
import "../src/slice/src/scss/main.scss";
import "../src/styles/storybook.scss";
import { TOKEN_VALUES } from "../generated/token/tokens.js";
import {
  initialize_avatar_images,
  initialize_custom_selects,
} from "../src/slice/src/js/script.js";

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

export const decorators = [
  (story_render) => {
    document.body.classList.add("jurenites-theme");
    const story_output = story_render();
    window.requestAnimationFrame(() => {
      initialize_avatar_images(document);
      initialize_custom_selects(document);
    });
    return story_output;
  },
];
