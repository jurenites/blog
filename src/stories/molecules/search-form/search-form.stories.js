import { search_form_markup } from "./search-form.markup.js";

const FIELD_LABEL = "Search the journal";
const FIELD_PLACEHOLDER = "Try “Drupal” or “design systems”";
const BUTTON_LABEL = "Search";
const FORM_ACTION = "#search-results";

function render_story(story_args) {
  return search_form_markup(story_args);
}

export default {
  title: "Molecules/Search Form",
  tags: ["autodocs"],
  render: render_story,
  argTypes: {
    field_label: { control: "text" },
    field_placeholder: { control: "text" },
    button_label: { control: "text" },
    form_action: { control: "text" },
  },
  args: {
    field_label: FIELD_LABEL,
    field_placeholder: FIELD_PLACEHOLDER,
    button_label: BUTTON_LABEL,
    form_action: FORM_ACTION,
  },
};

export const default_story = {};
