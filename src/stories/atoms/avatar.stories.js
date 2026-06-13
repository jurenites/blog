// Atom: Avatar. Image or initials; size via Controls.

function render({ size, initials, imageUrl }) {
  const modifier = size === "medium" ? "" : ` avatar--${size}`;
  const inner = imageUrl
    ? `<img class="avatar__image" src="${imageUrl}" alt="" />`
    : `<span class="avatar__initials">${initials}</span>`;
  return `<span class="avatar${modifier}">${inner}</span>`;
}

export default {
  title: "Atoms/Avatar",
  tags: ["autodocs"],
  render,
  argTypes: {
    size: { control: { type: "inline-radio" }, options: ["small", "medium", "large"] },
    initials: { control: "text" },
    imageUrl: { control: "text" },
  },
  args: {
    size: "medium",
    initials: "AI",
    imageUrl: "",
  },
};

export const Default = {};
