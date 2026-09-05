import { addons as storybook_addons } from "@storybook/manager-api";
import { create as create_storybook_theme } from "@storybook/theming/create";

const STORYBOOK_THEME = create_storybook_theme({
  base: "dark",
  fontBase: '"Open Sans", "Helvetica Neue", Arial, sans-serif',
  fontCode: '"Courier New", Courier, monospace',
});

storybook_addons.setConfig({
  theme: STORYBOOK_THEME,
});
