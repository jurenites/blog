// Atom: Badge. Status label; variant via Controls.
import badge_template from "./badge.template.html?raw";
import { token_default_option, token_option_names } from "../../foundations/token-values.js";
import { escape_html, render_template } from "../../template.js";

const BADGE_LABEL = "Published";
const STATUS_VARIANT_PREFIX = "component-badge-status-";
const STATUS_VARIANT = token_default_option("component-badge-default-status", STATUS_VARIANT_PREFIX);

const status_variant_options = token_option_names(STATUS_VARIANT_PREFIX);

function render_story({ badge_label, status_variant }) {
  const base_status_variant = status_variant_options[0];
  const badge_class_name = status_variant === base_status_variant ? "badge" : `badge badge--${status_variant}`;
  return render_template(badge_template, {
    badge_class_name,
    badge_label_text: escape_html(badge_label),
  });
}

export default {
  title: "Atoms/Badge",
  tags: ["autodocs"],
  render: render_story,
  argTypes: {
    badge_label: { control: "text" },
    status_variant: {
      control: { type: "inline-radio" },
      options: status_variant_options,
    },
  },
  args: {
    badge_label: BADGE_LABEL,
    status_variant: STATUS_VARIANT,
  },
};

export const default_story = {};
