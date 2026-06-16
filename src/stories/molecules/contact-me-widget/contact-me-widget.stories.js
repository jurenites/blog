// Molecule: Contact Me Widget. Avatar + identity + call to action.
import widget_template from "./contact-me-widget.template.html?raw";
import { avatar_markup } from "../../atoms/avatar/avatar.markup.js";
import { button_markup } from "../../atoms/button/button.markup.js";
import { escape_html, render_template } from "../../template.js";

const PERSON_NAME = "Alexander Ilivanov";
const PERSON_ROLE = "Designer / Drupal engineer";
const AVATAR_INITIALS = "AI";
const BUTTON_LABEL = "Contact me";

function render_story({ person_name, person_role, avatar_initials, button_label }) {
  return render_template(widget_template, {
    name: escape_html(person_name),
    role: escape_html(person_role),
    avatar_content: avatar_markup({ avatar_initials }),
    action_button: button_markup({ button_label, style_variant: "primary" }),
  });
}

export default {
  title: "Molecules/Contact Me Widget",
  tags: ["autodocs"],
  render: render_story,
  argTypes: {
    person_name: { control: "text" },
    person_role: { control: "text" },
    avatar_initials: { control: "text" },
    button_label: { control: "text" },
  },
  args: {
    person_name: PERSON_NAME,
    person_role: PERSON_ROLE,
    avatar_initials: AVATAR_INITIALS,
    button_label: BUTTON_LABEL,
  },
};

export const default_story = {};
