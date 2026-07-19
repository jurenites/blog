/** @type { import('@storybook/html-vite').StorybookConfig } */
const config = {
  stories: ["../src/**/*.stories.@(js|mdx)"],
  staticDirs: [
    "../src/public",
    { from: "../src/styles", to: "/styles" },
    { from: "../generated/storybook", to: "/" },
  ],
  addons: ["@storybook/addon-essentials"],
  framework: {
    name: "@storybook/html-vite",
    options: {}
  },
  docs: {
    autodocs: "tag"
  },
  core: {
    allowedHosts: ["storybook.jurenites.local"],
  }
};

export default config;
