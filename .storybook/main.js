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
  favicon: "../src/public/storybook-favicon-16.svg",
  core: {
    allowedHosts: ["storybook.jurenites.local"],
  },
  viteFinal: async (vite_config) => ({
    ...vite_config,
    server: {
      ...vite_config.server,
      hmr: {
        ...(typeof vite_config.server?.hmr === "object" ? vite_config.server.hmr : {}),
        clientPort: 80,
      },
    },
  }),
};

export default config;
