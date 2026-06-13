// Atom: Chip/tag. Use Controls for label and accent state.

function render({ label, accent }) {
  return `<span class="chip${accent ? " chip--accent" : ""}">${label}</span>`;
}

export default {
  title: "Atoms/Chip",
  tags: ["autodocs"],
  render,
  argTypes: {
    label: { control: "text" },
    accent: { control: "boolean" },
  },
  args: {
    label: "Drupal",
    accent: false,
  },
};

export const Default = {};
