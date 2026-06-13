// Atom: Badge. Status label; variant via Controls.

function render({ label, variant }) {
  const modifier = variant === "neutral" ? "" : ` badge--${variant}`;
  return `<span class="badge${modifier}">${label}</span>`;
}

export default {
  title: "Atoms/Badge",
  tags: ["autodocs"],
  render,
  argTypes: {
    label: { control: "text" },
    variant: {
      control: { type: "inline-radio" },
      options: ["neutral", "success", "warning", "error", "info"],
    },
  },
  args: {
    label: "Published",
    variant: "success",
  },
};

export const Default = {};
