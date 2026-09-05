import {
  create_media_loader_noise,
  initialize_media_loader_progress,
} from "../../../slice/src/js/script.js";
import { media_loader_markup } from "./media-loader.markup.js";

const LOADING_PROGRESS_LABEL = "Loading external video";
const SIMULATED_LOAD_DURATION = 8000;

function render_media_loader_story({ simulated_load_duration_ms }) {
  const story_container = document.createElement("div");
  story_container.className = "storybook-stack storybook-stack--medium";
  story_container.innerHTML = media_loader_markup({
    progress_label: LOADING_PROGRESS_LABEL,
  });

  const media_loader = story_container.querySelector(".media-loader");
  const noise_surface = story_container.querySelector("[data-jurenites-media-loader-noise]");
  const progress_element = story_container.querySelector(".media-loader__progress");
  let complete_simulated_load;
  const simulated_load = new Promise((resolve_simulated_load) => {
    complete_simulated_load = resolve_simulated_load;
  });
  const simulated_load_timer = window.setTimeout(
    complete_simulated_load,
    simulated_load_duration_ms,
  );
  const initialization_frame = window.requestAnimationFrame(() => {
    noise_surface.jurenites_media_loader_initialized = true;
    create_media_loader_noise(noise_surface);
    initialize_media_loader_progress({
      completion_promise: simulated_load,
      expected_wait_duration: simulated_load_duration_ms,
      loading_container: media_loader,
      progress_element,
    });
  });
  const removal_observer = new MutationObserver(() => {
    if (!story_container.isConnected) {
      window.cancelAnimationFrame(initialization_frame);
      window.clearTimeout(simulated_load_timer);
      progress_element.jurenites_media_loader_progress_destroy?.();
      noise_surface.jurenites_media_loader_destroy?.();
      removal_observer.disconnect();
    }
  });
  removal_observer.observe(document.body, { childList: true, subtree: true });

  return story_container;
}

export default {
  title: "Molecules/Media Loader",
  tags: ["autodocs"],
  render: render_media_loader_story,
  parameters: {
    docs: {
      description: {
        component: "The Drupal external-video loading state: a 16:9 TV-static placeholder with a one-pixel progress line. The line tracks elapsed wait and completes when the iframe loads; reduced-motion renders one frozen noise frame.",
      },
    },
  },
  argTypes: {
    simulated_load_duration_ms: {
      control: { type: "range", min: 1000, max: 20000, step: 1000 },
      description: "Story-only duration used to demonstrate an iframe load wait.",
    },
  },
  args: {
    simulated_load_duration_ms: SIMULATED_LOAD_DURATION,
  },
};

export const default_story = {};
