import action_template from "./call-to-action.template.html?raw";
import { button_link_markup } from "../../atoms/button/button.markup.js";
import { escape_html, render_template } from "../../template.js";

const PROMPT_HEADING = "GOT A PROJECT?";
const INVITATION_HEADING = "LET'S DISCUSS IT!";
const BUTTON_LABEL = "CONTACT";
const CONTACT_URL = "/contact";

function render_story(story_args) {
  return render_template(action_template, {
    prompt_heading: escape_html(story_args.prompt_heading),
    invitation_heading: escape_html(story_args.invitation_heading),
    contact_button: button_link_markup({
      button_label: story_args.button_label,
      link_url: story_args.contact_url,
      style_variant: "primary",
      additional_class_names: "call-to-action__contact-button",
    }),
  });
}

export default {
  title: "Organisms/Call to Action",
  tags: ["autodocs"],
  render: render_story,
  argTypes: {
    prompt_heading: { control: "text" },
    invitation_heading: { control: "text" },
    button_label: { control: "text" },
    contact_url: { control: "text" },
  },
  args: {
    prompt_heading: PROMPT_HEADING,
    invitation_heading: INVITATION_HEADING,
    button_label: BUTTON_LABEL,
    contact_url: CONTACT_URL,
  },
};

export const default_story = {};
