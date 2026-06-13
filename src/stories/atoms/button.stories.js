// Atom: Button. One story; use the Controls tab for every variant combination.

function render({ label, variant, disabled }) {
  return `<button class="button button--${variant}"${disabled ? " disabled" : ""}>${label}</button>`;
}

export default {
  title: "Atoms/Button",
  tags: ["autodocs"],
  render,
  argTypes: {
    label: { control: "text" },
    variant: {
      control: { type: "inline-radio" },
      options: ["primary", "secondary", "ghost"],
    },
    disabled: { control: "boolean" },
  },
  args: {
    label: "Hire me",
    variant: "primary",
    disabled: false,
  },
};

export const Default = {};
