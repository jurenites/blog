// Atom: Surface (panel/card container). Use Controls for the variant.
import surface_template from "./surface.template.html?raw";
import { escape_html, render_template } from "../template.js";

function render_story({ surface_variant, surface_heading, surface_body }) {
  const surface_modifier = surface_variant === "default" ? "" : ` surface--${surface_variant}`;
  return render_template(surface_template, {
    modifier: surface_modifier,
    heading: escape_html(surface_heading),
    body: escape_html(surface_body),
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
    surface_heading: { control: "text" },
    surface_body: { control: "text" },
  },
  args: {
    surface_variant: "default",
    surface_heading: "Panel surface",
    surface_body: "Surfaces use elevation, corner-radius, and border tokens.",
  },
};

export const default_story = {};
