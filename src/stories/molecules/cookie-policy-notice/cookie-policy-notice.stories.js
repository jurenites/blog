import { cookie_policy_notice_markup } from "./cookie-policy-notice.markup.js";

// Storybook-only preview fixtures. Drupal reads the public copy from a Content Block.
const EXAMPLE_NOTICE_HEADING = "This website NOT using cookies.";
const EXAMPLE_NOTICE_MESSAGE = "An EU Commission estimate puts the annual ritual of clicking cookie banners at about 334 million human hours. This is not a consent request.";
const EXAMPLE_CLOSING_MESSAGE = "Enjoy the free internet without interruption.";
const EXAMPLE_DISMISS_BUTTON_LABEL = "Whatever";

function render_story(story_args) {
  return cookie_policy_notice_markup(story_args);
}

export default {
  title: "Molecules/Cookie Policy Notice",
  tags: ["autodocs"],
  render: render_story,
  parameters: {
    docs: {
      description: {
        component: "Footer notice for a site that does not use cookies. The Drupal behavior stores only a local dismissal preference.",
      },
    },
  },
  argTypes: {
    notice_heading: { control: "text" },
    notice_message: { control: "text" },
    closing_message: { control: "text" },
    dismiss_button_label: { control: "text" },
  },
  args: {
    notice_heading: EXAMPLE_NOTICE_HEADING,
    notice_message: EXAMPLE_NOTICE_MESSAGE,
    closing_message: EXAMPLE_CLOSING_MESSAGE,
    dismiss_button_label: EXAMPLE_DISMISS_BUTTON_LABEL,
  },
};

export const default_story = {};
