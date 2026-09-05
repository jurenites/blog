// Storybook consumes the same compiled design system as the Drupal theme:
// src/slice/src/scss/main.scss is the single CSS source of truth.
import "../src/slice/src/scss/main.scss";
import "../src/styles/storybook.scss";
import { TOKEN_VALUES } from "../generated/token/tokens.js";
import {
  initialize_avatar_images,
  initialize_custom_selects,
  initialize_pixel_glyph_editors,
  initialize_tooltips,
} from "../src/slice/src/js/script.js";
import { initialize_font_previews } from "../src/slice/src/js/font-preview.js";

const PREVIEW_WATERMARK_ID = "storybook-preview-watermark";

function create_preview_watermark() {
  const build_information = globalThis.STORYBOOK_BUILD_INFO;

  if (!build_information || document.getElementById(PREVIEW_WATERMARK_ID)) {
    return;
  }

  const watermark_element = document.createElement("div");
  const identity_line = document.createElement("span");
  const version_label = document.createElement("span");
  const version_number = document.createElement("span");
  const version_separator = document.createElement("span");
  const updated_gmt = document.createElement("span");
  const date_separator = document.createElement("span");
  const git_hash_link = document.createElement("a");
  const credit_line = document.createElement("span");
  const credit_label = document.createElement("span");

  watermark_element.id = PREVIEW_WATERMARK_ID;
  watermark_element.className = "version-watermark";
  watermark_element.setAttribute("aria-label", "Storybook preview build information");

  identity_line.className = "version-watermark__line";
  version_label.className = "version-watermark__label";
  version_label.textContent = "Version";
  version_number.className = "version-watermark__number";
  version_number.textContent = build_information.project_version;
  version_separator.className = "version-watermark__separator";
  version_separator.textContent = "·";
  version_separator.setAttribute("aria-hidden", "true");
  updated_gmt.className = "version-watermark__updated-gmt";
  updated_gmt.textContent = build_information.created_gmt;
  date_separator.className = "version-watermark__separator";
  date_separator.textContent = "·";
  date_separator.setAttribute("aria-hidden", "true");
  git_hash_link.className = "version-git-hash";
  git_hash_link.href = build_information.commit_url;
  git_hash_link.target = "_blank";
  git_hash_link.rel = "noopener noreferrer";
  git_hash_link.textContent = build_information.commit_hash;
  identity_line.append(
    version_label,
    version_number,
    version_separator,
    updated_gmt,
    date_separator,
    git_hash_link,
  );

  credit_line.className = "version-watermark__line";
  credit_label.className = "version-watermark__credit";
  credit_label.textContent = "made by";
  credit_line.append(credit_label);
  build_information.collaboration_credit.forEach((collaborator_name, collaborator_index) => {
    if (collaborator_index > 0) {
      const collaborator_separator = document.createElement("span");
      collaborator_separator.className = "version-watermark__separator";
      collaborator_separator.textContent = "&";
      credit_line.append(collaborator_separator);
    }

    const collaborator_element = document.createElement("span");
    collaborator_element.className = "version-watermark__credit_name";
    collaborator_element.textContent = collaborator_name;
    credit_line.append(collaborator_element);
  });

  watermark_element.append(identity_line, credit_line);
  document.body.append(watermark_element);
}

function remove_preview_watermark() {
  document.getElementById(PREVIEW_WATERMARK_ID)?.remove();
}

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
  (story_render, story_context) => {
    document.body.classList.add("jurenites-theme");
    const story_output = story_render();
    window.requestAnimationFrame(() => {
      initialize_avatar_images(document);
      initialize_custom_selects(document);
      initialize_font_previews(document);
      initialize_pixel_glyph_editors(document);
      initialize_tooltips(document);
      if (story_context.parameters.preview_watermark?.disabled) {
        remove_preview_watermark();
      } else {
        create_preview_watermark();
      }
    });
    return story_output;
  },
];
