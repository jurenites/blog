import { version_watermark_markup } from "./version-watermark.markup.js";

const VERSION_LABEL = "Version";
const VERSION_NUMBER = "0.0.15";
const UPDATED_GMT = "2026-07-19 20:00:00 GMT+0";
const GIT_HASH = "336c86c";
const GIT_URL = "https://github.com/jurenites/blog/commit/336c86c254c2f7c20d22946547e00a48f0389c13";
const CREDIT_TEXT = "made by Alexander Ilivanov & AI";

function render_story(story_args) {
  return version_watermark_markup(story_args);
}

export default {
  title: "Atoms/Version Watermark",
  tags: ["autodocs"],
  render: render_story,
  argTypes: {
    version_label: {
      control: "text",
      description: "Label preceding the project version.",
    },
    version_number: {
      control: "text",
      description: "Shared project version embedded in screenshots.",
    },
    credit_text: {
      control: "text",
      description: "Visible collaboration credit embedded in screenshots.",
    },
    git_hash: {
      control: "text",
      description: "Short Git commit hash.",
    },
    git_url: {
      control: "text",
      description: "Exact GitHub commit URL.",
    },
    updated_gmt: {
      control: "text",
      description: "Build update date and time in the GMT+0 timezone.",
    },
  },
  args: {
    version_label: VERSION_LABEL,
    version_number: VERSION_NUMBER,
    updated_gmt: UPDATED_GMT,
    git_hash: GIT_HASH,
    git_url: GIT_URL,
    credit_text: CREDIT_TEXT,
  },
};

export const default_story = {};
