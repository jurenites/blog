// Atom: Divider. Use Controls for the strong variant.

function render({ strong }) {
  return `
    <div class="storybook-stack">
      <p>Above the divider</p>
      <hr class="divider${strong ? " divider--strong" : ""}" />
      <p>Below the divider</p>
    </div>
  `;
}

export default {
  title: "Atoms/Divider",
  tags: ["autodocs"],
  render,
  argTypes: {
    strong: { control: "boolean" },
  },
  args: {
    strong: false,
  },
};

export const Default = {};
