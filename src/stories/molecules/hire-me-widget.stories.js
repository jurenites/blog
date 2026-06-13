// Molecule: Hire Me Widget. Avatar + identity + call to action.

function render({ name, role, initials, buttonLabel }) {
  return `
    <div class="storybook-stack" style="max-width: 480px;">
      <aside class="hire-me-widget">
        <span class="avatar"><span class="avatar__initials">${initials}</span></span>
        <div class="hire-me-widget__body">
          <p class="hire-me-widget__name">${name}</p>
          <p class="hire-me-widget__role">${role}</p>
        </div>
        <div class="hire-me-widget__actions">
          <button class="button button--primary">${buttonLabel}</button>
        </div>
      </aside>
    </div>
  `;
}

export default {
  title: "Molecules/Hire Me Widget",
  tags: ["autodocs"],
  render,
  argTypes: {
    name: { control: "text" },
    role: { control: "text" },
    initials: { control: "text" },
    buttonLabel: { control: "text" },
  },
  args: {
    name: "Alexander Ilivanov",
    role: "Designer / Drupal engineer",
    initials: "AI",
    buttonLabel: "Hire me",
  },
};

export const Default = {};
