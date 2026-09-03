import { footer_navigation_markup } from "./footer-navigation.markup.js";

const PRIVACY_POLICY_LABEL = "Privacy Policy";
const PRIVACY_POLICY_URL = "/privacy-policy";
const RIGHTS_MESSAGE = "No rights reserved";
const CURRENT_YEAR = String(new Date().getFullYear());

function render_story(story_args) {
  return footer_navigation_markup(story_args);
}

export default {
  title: "Organisms/Footer Navigation",
  tags: ["autodocs"],
  render: render_story,
  parameters: {
    docs: {
      description: {
        component: "Transparent site-information footer with secondary navigation and an intentionally unserious rights message.",
      },
    },
  },
  argTypes: {
    privacy_policy_label: { control: "text" },
    privacy_policy_url: { control: "text" },
    rights_message: { control: "text" },
    current_year: { control: "text" },
  },
  args: {
    privacy_policy_label: PRIVACY_POLICY_LABEL,
    privacy_policy_url: PRIVACY_POLICY_URL,
    rights_message: RIGHTS_MESSAGE,
    current_year: CURRENT_YEAR,
  },
};

export const default_story = {};
