import { footer_navigation_markup } from "./footer-navigation.markup.js";
import social_profiles from "../../../../web/themes/custom/jurenites_theme/social-links.json";

const SOCIAL_HEADING = "Social networks";
const INFORMATION_HEADING = "Information";
const SOCIAL_LINKS = social_profiles;
const PRIVACY_POLICY_LABEL = "Privacy Policy";
const PRIVACY_POLICY_URL = "/privacy-policy";
const FONTS_LABEL = "Fonts";
const FONTS_URL = "/portfolio?tag=font";
const FONT_PROJECT_COUNT = "2";
const TIMELINE_LABEL = "Timeline";
const TIMELINE_URL = "/timeline";
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
        component: "Vertical social profiles that open in a new window. Hover and keyboard focus reveal each account name, its brand color, and the shared External Link icon. Information links and the rights message appear alongside them.",
      },
    },
  },
  argTypes: {
    social_heading: { control: "text" },
    information_heading: { control: "text" },
    social_links: { control: "object" },
    privacy_policy_label: { control: "text" },
    privacy_policy_url: { control: "text" },
    fonts_label: { control: "text" },
    fonts_url: { control: "text" },
    font_project_count: { control: "text" },
    timeline_label: { control: "text" },
    timeline_url: { control: "text" },
    rights_message: { control: "text" },
    current_year: { control: "text" },
  },
  args: {
    social_heading: SOCIAL_HEADING,
    information_heading: INFORMATION_HEADING,
    social_links: SOCIAL_LINKS,
    privacy_policy_label: PRIVACY_POLICY_LABEL,
    privacy_policy_url: PRIVACY_POLICY_URL,
    fonts_label: FONTS_LABEL,
    fonts_url: FONTS_URL,
    font_project_count: FONT_PROJECT_COUNT,
    timeline_label: TIMELINE_LABEL,
    timeline_url: TIMELINE_URL,
    rights_message: RIGHTS_MESSAGE,
    current_year: CURRENT_YEAR,
  },
};

export const default_story = {};
