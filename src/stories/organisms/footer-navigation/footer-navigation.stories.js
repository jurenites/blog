import { footer_navigation_markup } from "./footer-navigation.markup.js";
import social_profiles from "../../../../web/themes/custom/jurenites_theme/social-links.json";

const SOCIAL_HEADING = "Social networks";
const MESSENGERS_HEADING = "Get in touch";
const INFORMATION_HEADING = "Information";
const HOW_I_WORK_HEADING = "How I work";
const GUIDELINE_LABEL = "Guideline";
const GUIDELINE_URL = "/guidelines";
const GUIDELINE_ACTIVE_STATE = "";
const GUIDELINE_PARENT_STATE = "location";
const GUIDELINE_PAGE_STATE = "page";
const SOCIAL_LINKS = social_profiles;
const MESSENGER_LINKS = [
  { link_label: "Telegram", hover_label: "@jurenites", link_url: "https://t.me/jurenites", icon_name: "brand-telegram" },
  { link_label: "Gmail", hover_label: "jurenites@gmail.com", link_url: "mailto:jurenites@gmail.com", icon_name: "brand-gmail" },
];
const HOW_I_WORK_LINKS = [
  { link_label: "GitHub", hover_label: "blog_jurenites", link_url: "https://github.com/jurenites/blog", icon_name: "brand-github", color_token: "github" },
  { link_label: "Figma", hover_label: "blog jurenites", link_url: "https://www.figma.com/design/UMshUcV87SZqsg1aDaDpnZ/blog-jurenites?node-id=928-133&t=n2l2EWw0ldyJzj4u-0", icon_name: "brand-figma", color_token: "figma", hover_parts: [{ text: "bl", color_token: "figma-overlay-bl" }, { text: "og", color_token: "figma-overlay-og" }, { text: "\u00a0", color_token: "" }, { text: "jur", color_token: "figma-overlay-jur" }, { text: "eni", color_token: "figma-overlay-eni" }, { text: "tes", color_token: "figma-overlay-tes" }] },
  { link_label: "Storybook", hover_label: "blog jurenites", link_url: "http://storybook.jurenites.com/", icon_name: "brand-storybook", color_token: "storybook" },
];
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
        component: "Social profiles and Telegram open in a new window; Gmail opens your email app. Hover and keyboard focus reveal each account name, its brand color, and, for web links, the shared External Link icon. Information links and the rights message appear alongside them.",
      },
    },
  },
  argTypes: {
    social_heading: { control: "text" },
    messengers_heading: { control: "text" },
    information_heading: { control: "text" },
    how_i_work_heading: { control: "text" },
    guideline_label: { control: "text" },
    guideline_url: { control: "text" },
    guideline_active_state: { control: "select", options: ["", "page", "location"] },
    how_i_work_links: { control: "object" },
    messenger_links: { control: "object" },
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
    messengers_heading: MESSENGERS_HEADING,
    information_heading: INFORMATION_HEADING,
    how_i_work_heading: HOW_I_WORK_HEADING,
    guideline_label: GUIDELINE_LABEL,
    guideline_url: GUIDELINE_URL,
    guideline_active_state: GUIDELINE_ACTIVE_STATE,
    how_i_work_links: HOW_I_WORK_LINKS,
    messenger_links: MESSENGER_LINKS,
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

export const guideline_parent_active = {
  args: { guideline_active_state: GUIDELINE_PARENT_STATE },
};

export const guideline_page_active = {
  args: { guideline_active_state: GUIDELINE_PAGE_STATE },
};
