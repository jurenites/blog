// Molecule: Contact Me Widget. Avatar + identity + call to action.
import widget_template from "./contact-me-widget.template.html?raw";
import { escape_html, render_template } from "../template.js";

function render_story({ person_name, person_role, avatar_initials, button_label }) {
  return render_template(widget_template, {
    name: escape_html(person_name),
    role: escape_html(person_role),
    initials: escape_html(avatar_initials),
    button_label: escape_html(button_label),
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
    person_name: "Alexander Ilivanov",
    person_role: "Designer / Drupal engineer",
    avatar_initials: "AI",
    button_label: "Contact me",
  },
};

export const default_story = {};
