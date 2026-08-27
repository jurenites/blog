import { create_media_loader_noise } from "../../../slice/src/js/script.js";
import { media_loader_markup } from "./media-loader.markup.js";

const MEDIA_FILE_NAME = "studio-walkthrough.mp4";
const UPLOAD_PERCENTAGE = 42;
const STATUS_MESSAGE = "Uploading video";

function render_story({ media_file_name, upload_percentage, status_message }) {
  const story_container = document.createElement("div");
  story_container.className = "storybook-stack storybook-stack--medium";
  story_container.innerHTML = media_loader_markup({
    media_file_name,
    upload_percentage,
    status_message,
  });

  const noise_surface = story_container.querySelector("[data-jurenites-media-loader-noise]");
  const initialization_frame = window.requestAnimationFrame(() => {
    noise_surface.jurenites_media_loader_initialized = true;
    create_media_loader_noise(noise_surface);
  });
  const removal_observer = new MutationObserver(() => {
    if (!story_container.isConnected) {
      window.cancelAnimationFrame(initialization_frame);
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
  render: render_story,
  parameters: {
    docs: {
      description: {
        component: "A 16:9 video-upload placeholder with low-speed independent TV-static frames. Reduced-motion renders one frozen frame.",
      },
    },
  },
  argTypes: {
    media_file_name: { control: "text" },
    upload_percentage: { control: { type: "range", min: 0, max: 100, step: 1 } },
    status_message: { control: "text" },
  },
  args: {
    media_file_name: MEDIA_FILE_NAME,
    upload_percentage: UPLOAD_PERCENTAGE,
    status_message: STATUS_MESSAGE,
  },
};

export const default_story = {};
