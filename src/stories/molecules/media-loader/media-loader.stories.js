import {
  create_media_loader_noise,
  initialize_media_loader_progress,
} from "../../../slice/src/js/script.js";
import { TOKEN_VALUES } from "../../../../generated/token/tokens.js";
import { media_loader_markup } from "./media-loader.markup.js";

const IMAGE_LOADING_PROGRESS_LABEL = "Loading portfolio thumbnail";
const VIDEO_LOADING_PROGRESS_LABEL = "Loading external video";
const SIMULATED_LOAD_DURATION = 8000;
const PORTFOLIO_THUMBNAIL_ALT = "Abstract landscape portfolio thumbnail";
const PORTFOLIO_THUMBNAIL_URL = "/assets/images/article-teaser-sample.svg";
const DEFAULT_IMAGE_AVERAGE_COLOR = TOKEN_VALUES["color-palette-deep-gray"];

function image_loading_surface_markup() {
  return '<div class="media-loader__skeleton" aria-hidden="true"></div>';
}

function image_content_markup() {
  return `<div class="media-loader__content"><img src="${PORTFOLIO_THUMBNAIL_URL}" alt="${PORTFOLIO_THUMBNAIL_ALT}"></div>`;
}

function video_loading_surface_markup() {
  return '<div class="media-loader__noise" data-jurenites-media-loader-noise aria-hidden="true"></div>';
}

function render_media_loader_story({
  image_average_color,
  simulated_load_duration_ms,
  use_video_noise,
}) {
  const story_container = document.createElement("div");
  const loader_class = use_video_noise
    ? "media-loader--video-noise"
    : "media-loader--image-skeleton";
  story_container.className = "storybook-stack storybook-stack--medium";
  story_container.innerHTML = media_loader_markup({
    loader_class,
    loading_surface_markup: use_video_noise
      ? video_loading_surface_markup()
      : image_loading_surface_markup(),
    media_content_markup: use_video_noise ? "" : image_content_markup(),
    progress_label: use_video_noise
      ? VIDEO_LOADING_PROGRESS_LABEL
      : IMAGE_LOADING_PROGRESS_LABEL,
  });

  const media_loader = story_container.querySelector(".media-loader");
  const noise_surface = story_container.querySelector("[data-jurenites-media-loader-noise]");
  const progress_element = story_container.querySelector(".media-loader__progress");
  if (!use_video_noise) {
    media_loader.style.setProperty("--media-loader-average-color", image_average_color);
    media_loader.dataset.averageColor = image_average_color;
  }
  let complete_simulated_load;
  const simulated_load = new Promise((resolve_simulated_load) => {
    complete_simulated_load = resolve_simulated_load;
  });
  const simulated_load_timer = window.setTimeout(
    complete_simulated_load,
    simulated_load_duration_ms,
  );
  const initialization_frame = window.requestAnimationFrame(() => {
    if (noise_surface) {
      noise_surface.jurenites_media_loader_initialized = true;
      create_media_loader_noise(noise_surface);
    }
    initialize_media_loader_progress({
      completion_promise: simulated_load,
      expected_wait_duration: simulated_load_duration_ms,
      loading_container: media_loader,
      progress_element,
    });
    simulated_load.then(() => {
      media_loader.dataset.loadingStage = "complete";
    });
  });
  const removal_observer = new MutationObserver(() => {
    if (!story_container.isConnected) {
      window.cancelAnimationFrame(initialization_frame);
      window.clearTimeout(simulated_load_timer);
      progress_element.jurenites_media_loader_progress_destroy?.();
      noise_surface?.jurenites_media_loader_destroy?.();
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
        component: "A shared 16:9 media loading frame. Portfolio images use an average-color skeleton with a restrained gradient sheen before the responsive image crossfades in. External videos retain a separate TV-static treatment. The one-pixel line communicates loading stages rather than byte-level download progress.",
      },
    },
  },
  argTypes: {
    image_average_color: {
      control: "color",
      description: "Image-derived average color shown under the skeleton gradient.",
      if: { arg: "use_video_noise", truthy: false },
    },
    simulated_load_duration_ms: {
      control: { type: "range", min: 1000, max: 20000, step: 1000 },
      description: "Story-only duration used to demonstrate the loading handoff.",
    },
    use_video_noise: {
      control: "boolean",
      description: "Uses the legacy TV-static surface reserved for external video loads.",
    },
  },
  args: {
    image_average_color: DEFAULT_IMAGE_AVERAGE_COLOR,
    simulated_load_duration_ms: SIMULATED_LOAD_DURATION,
    use_video_noise: false,
  },
};

export const default_story = {};

export const external_video_noise = {
  args: {
    use_video_noise: true,
  },
};
