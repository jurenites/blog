// Atom: Badge. Status label; variant via Controls.
import badge_template from "./badge.template.html?raw";
import { escape_html, render_template } from "../template.js";

function render_story({ badge_label, status_variant }) {
  const badge_modifier = status_variant === "neutral" ? "" : ` badge--${status_variant}`;
  return render_template(badge_template, { modifier: badge_modifier, label: escape_html(badge_label) });
}

export default {
  title: "Atoms/Badge",
  tags: ["autodocs"],
  render: render_story,
  argTypes: {
    badge_label: { control: "text" },
    status_variant: {
      control: { type: "inline-radio" },
      options: ["neutral", "success", "warning", "error", "info"],
    },
  },
  args: {
    badge_label: "Published",
    status_variant: "success",
  },
};

export const default_story = {};
