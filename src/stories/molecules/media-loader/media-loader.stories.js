import {
  create_media_loader_noise,
  initialize_media_loader_progress,
} from "../../../slice/src/js/script.js";
import { TOKEN_VALUES } from "../../../../generated/token/tokens.js";
import { escape_html } from "../../template.js";
import { media_loader_markup } from "./media-loader.markup.js";

const IMAGE_LOADING_PROGRESS_LABEL = "Loading portfolio thumbnail";
const VIDEO_LOADING_PROGRESS_LABEL = "Loading external video";
const SIMULATED_LOAD_DURATION = 8000;
const PORTFOLIO_THUMBNAIL_ALT = "Portfolio photograph";
const PORTFOLIO_THUMBNAIL_URL = "/assets/images/storybook/dsc_0001.webp";
const ANIMATED_IMAGE_URL = "/assets/images/projects/skatch/map-list-animation.gif";
const VIDEO_RECORDING_URL = "/assets/videos/skatch-app-list.mp4";
const DEFAULT_IMAGE_AVERAGE_COLOR = TOKEN_VALUES["color-palette-deep-gray"];

function image_loading_surface_markup() {
  return '<div class="media-loader__skeleton" aria-hidden="true"></div>';
}

function image_content_markup(media_source, media_kind, media_description) {
  if (media_kind === "video") return `<div class="media-loader__content"><video src="${escape_html(media_source)}" aria-label="${escape_html(media_description)}" muted autoplay loop playsinline></video></div>`;
  return `<div class="media-loader__content"><img src="${escape_html(media_source)}" alt="${escape_html(media_description)}"></div>`;
}

function video_loading_surface_markup() {
  return '<div class="media-loader__noise" data-jurenites-media-loader-noise aria-hidden="true"></div>';
}

function render_media_loader_story({
  image_average_color,
  media_source,
  media_kind,
  media_description,
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
    media_content_markup: use_video_noise ? "" : image_content_markup(media_source, media_kind, media_description),
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
  const media_element = story_container.querySelector("img, video");
  let delay_complete = false;
  function reveal_ready_media() {
    if (delay_complete && (!media_element || media_element.naturalWidth > 0 || media_element.readyState >= 2)) {
      media_loader.dataset.loadingStage = "complete";
      media_loader.setAttribute("aria-busy", "false");
    }
  }
  media_element?.addEventListener(media_kind === "video" ? "loadeddata" : "load", reveal_ready_media);
  const media_ready = new Promise((resolve_media) => {
    if (!media_element) {
      resolve_media();
      return;
    }
    media_element.addEventListener(media_kind === "video" ? "loadeddata" : "load", resolve_media, { once: true });
    media_element.addEventListener("error", () => {
      media_loader.dataset.loadingStage = "error";
      media_loader.setAttribute("aria-busy", "false");
    });
    if (media_element.naturalWidth > 0 || media_element.readyState >= 2) resolve_media();
  });
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
      completion_promise: Promise.all([simulated_load, media_ready]),
      expected_wait_duration: simulated_load_duration_ms,
      loading_container: media_loader,
      progress_element,
    });
    Promise.all([simulated_load, media_ready]).then(() => {
      delay_complete = true;
      reveal_ready_media();
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
  title: "Molecules/Video/Media Loader",
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
    media_source: { control: "text", description: "Bundled image, GIF, or browser-playable video URL." },
    media_kind: { control: "select", options: ["image", "video"] },
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
    media_source: PORTFOLIO_THUMBNAIL_URL,
    media_kind: "image",
    media_description: PORTFOLIO_THUMBNAIL_ALT,
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

export const animated_image = { args: { media_source: ANIMATED_IMAGE_URL, media_description: "Skatch map and list animation" } };

export const video_file = { args: { media_source: VIDEO_RECORDING_URL, media_kind: "video", media_description: "Skatch app recording" } };
