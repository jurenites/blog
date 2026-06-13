// Atom: Surface (panel/card container). Use Controls for the variant.

function render({ variant, heading, body }) {
  const modifier = variant === "default" ? "" : ` surface--${variant}`;
  return `
    <div class="storybook-stack">
      <div class="surface${modifier}">
        <h3>${heading}</h3>
        <p>${body}</p>
      </div>
    </div>
  `;
}

export default {
  title: "Atoms/Surface",
  tags: ["autodocs"],
  render,
  argTypes: {
    variant: {
      control: { type: "inline-radio" },
      options: ["default", "raised", "flat"],
    },
    heading: { control: "text" },
    body: { control: "text" },
  },
  args: {
    variant: "default",
    heading: "Panel surface",
    body: "Surfaces use elevation, corner-radius, and border tokens.",
  },
};

export const Default = {};
