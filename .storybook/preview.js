// Storybook consumes the same compiled design system as the Drupal theme:
// src/slice/src/scss/main.scss is the single CSS source of truth.
import "../src/slice/src/scss/main.scss";
import "../src/styles/storybook.scss";

// Custom viewports mirror the breakpoint tokens (mobile 360-640, tablet, desktop 1280-1920+).
const breakpointViewports = {
  mobileMin: {
    name: "Mobile min (360px)",
    styles: { width: "360px", height: "780px" },
    type: "mobile",
  },
  mobileMax: {
    name: "Mobile max (640px)",
    styles: { width: "640px", height: "900px" },
    type: "mobile",
  },
  tablet: {
    name: "Tablet (834px)",
    styles: { width: "834px", height: "1112px" },
    type: "tablet",
  },
  desktopMin: {
    name: "Desktop min (1280px)",
    styles: { width: "1280px", height: "832px" },
    type: "desktop",
  },
  desktopFullHd: {
    name: "Desktop Full HD (1920px)",
    styles: { width: "1920px", height: "1080px" },
    type: "desktop",
  },
};

export const parameters = {
  layout: "fullscreen",
  backgrounds: { disable: true },
  viewport: {
    viewports: breakpointViewports,
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
