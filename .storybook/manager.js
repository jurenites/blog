import { addons as storybook_addons } from "@storybook/manager-api";
import { create as create_storybook_theme } from "@storybook/theming/create";
import { createElement as create_element } from "react";

function count_folder_stories(story_entry, storybook_api) {
  // Count each sidebar story entry once, without adding its scenario variants.
  if (story_entry?.type === "component" || story_entry?.type === "story") return 1;

  return (story_entry?.children ?? []).reduce((story_total, child_id) => (
    story_total + count_folder_stories(
      storybook_api.resolveStory(child_id, story_entry.refId),
      storybook_api,
    )
  ), 0);
}

function render_sidebar_label(story_entry, storybook_api) {
  if (story_entry.type !== "group") return story_entry.name;

  const story_total = count_folder_stories(story_entry, storybook_api);

  return create_element(
    "span",
    { className: "storybook-folder-label" },
    story_entry.name,
    create_element(
      "span",
      { className: "storybook-folder-label__count" },
      ` (${story_total})`,
    ),
  );
}

const STORYBOOK_THEME = create_storybook_theme({
  base: "dark",
  fontBase: '"Open Sans", "Helvetica Neue", Arial, sans-serif',
  fontCode: '"Courier New", Courier, monospace',
});

storybook_addons.setConfig({
  theme: STORYBOOK_THEME,
  sidebar: {
    renderLabel: render_sidebar_label,
  },
});
