import { newsletter_signup_markup } from "./newsletter-signup.markup.js";

const EYEBROW_HEADING = "From the notebook";
const SIGNUP_TITLE = "New essays, without the noise";
const SIGNUP_DESCRIPTION = "Occasional notes about design systems, publishing, and the tools between them.";
const EMAIL_PLACEHOLDER = "reader@example.com";
const BUTTON_LABEL = "Subscribe";
const PRIVACY_NOTE = "No tracking pixels. Unsubscribe whenever you like.";
const FORM_ACTION = "#subscribe";

function render_story(story_args) {
  return newsletter_signup_markup(story_args);
}

export default {
  title: "Organisms/Newsletter Signup",
  tags: ["autodocs"],
  render: render_story,
  argTypes: {
    eyebrow_heading: { control: "text" },
    signup_title: { control: "text" },
    signup_description: { control: "text" },
    email_placeholder: { control: "text" },
    button_label: { control: "text" },
    privacy_note: { control: "text" },
    form_action: { control: "text" },
  },
  args: {
    eyebrow_heading: EYEBROW_HEADING,
    signup_title: SIGNUP_TITLE,
    signup_description: SIGNUP_DESCRIPTION,
    email_placeholder: EMAIL_PLACEHOLDER,
    button_label: BUTTON_LABEL,
    privacy_note: PRIVACY_NOTE,
    form_action: FORM_ACTION,
  },
};

export const default_story = {};
