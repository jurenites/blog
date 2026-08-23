import { create_dither_trail_background } from "../../../slice/src/js/script.js";
import { create_particle_attraction_background } from "../../../slice/src/js/backgrounds/particle-attraction-background.js";
import { escape_html, render_template } from "../../template.js";
import backgrounds_template from "./backgrounds.template.html?raw";

const BACKGROUND_STYLE = "plain-black";
const BACKGROUND_STYLE_OPTIONS = ["plain-black", "dithering", "particle-attraction"];

function render_background_story({ background_style }) {
  const story_container = document.createElement("div");
  story_container.innerHTML = render_template(backgrounds_template, {
    background_style: escape_html(background_style),
  });

  const background_preview = story_container.querySelector("[data-background-preview]");
  let initialization_frame = 0;

  if (background_style === "dithering") {
    background_preview.classList.add("background-fx-canvas");
    initialization_frame = window.requestAnimationFrame(() => {
      create_dither_trail_background(background_preview);
    });
  }

  if (background_style === "particle-attraction") {
    initialization_frame = window.requestAnimationFrame(() => {
      create_particle_attraction_background(background_preview);
    });
  }

  const removal_observer = new MutationObserver(() => {
    if (!story_container.isConnected) {
      window.cancelAnimationFrame(initialization_frame);
      background_preview.jurenitesGradientDestroy?.();
      background_preview.jurenitesParticleDestroy?.();
      removal_observer.disconnect();
    }
  });
  removal_observer.observe(document.body, { childList: true, subtree: true });

  return story_container;
}

export default {
  title: "Components/Backgrounds",
  tags: ["autodocs"],
  render: render_background_story,
  parameters: {
    controls: {
      include: ["background_style"],
    },
    docs: {
      description: {
        component: "Full-page backgrounds shared by Storybook and the Drupal front page.",
      },
    },
  },
  argTypes: {
    background_style: {
      control: { type: "select" },
      options: BACKGROUND_STYLE_OPTIONS,
    },
  },
  args: {
    background_style: BACKGROUND_STYLE,
  },
};

export const default_story = {
  args: {
    background_style: "particle-attraction"
  }
};
