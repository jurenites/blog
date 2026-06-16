// Atom: Surface (panel/card container). Use Controls for the variant.
import surface_template from "./surface.template.html?raw";
import { render_template } from "../template.js";

const nested_component_examples = {
  button_group: `
    <div class="storybook-stack">
      <button class="button button--primary">Contact me</button>
      <button class="button button--secondary">View project</button>
    </div>
  `,
  chip_group: `
    <div class="storybook-stack">
      <span class="chip">ui/ux</span>
      <span class="chip chip--accent">Design system</span>
    </div>
  `,
  date_value: `
    <time class="date-value date-value--muted" datetime="2026-06-15">Jun 2026</time>
  `,
};

function render_story({ surface_variant, nested_component }) {
  const surface_modifier = surface_variant === "default" ? "" : ` surface--${surface_variant}`;
  return render_template(surface_template, {
    modifier: surface_modifier,
    nested_content: nested_component_examples[nested_component],
  });
}

export default {
  title: "Atoms/Surface",
  tags: ["autodocs"],
  render: render_story,
  argTypes: {
    surface_variant: {
      control: { type: "inline-radio" },
      options: ["default", "raised", "flat"],
    },
    nested_component: {
      control: { type: "select" },
      options: Object.keys(nested_component_examples),
    },
  },
  args: {
    surface_variant: "default",
    nested_component: "button_group",
  },
};

export const default_story = {};
