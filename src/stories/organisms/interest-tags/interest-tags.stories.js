import { interest_tags_markup } from "./interest-tags.markup.js";

const SECTION_HEADING = "My interests";
const SECTION_DESCRIPTION = "Topics I follow on YouTube. Choose an interest to filter the Videos collection.";
const INTEREST_ITEMS = [
  ["#UI/UX Design", "ui-ux-design"],
  ["#Programming", "programming"],
  ["#Cars", "cars"],
  ["#Game Dev", "game-dev"],
  ["#Artificial Intelligence", "artificial-intelligence"],
  ["#Hardware", "hardware"],
].map(([interest_name, interest_slug]) => ({
  interest_name,
  interest_url: `/videos?tag=${interest_slug}`,
}));

function render_interest_tags(story_args) {
  return interest_tags_markup({
    section_heading: story_args.section_heading,
    section_description: story_args.section_description,
    interest_items: INTEREST_ITEMS,
  });
}

export default {
  title: "Organisms/Interest Tags",
  tags: ["autodocs"],
  render: render_interest_tags,
  parameters: {
    docs: {
      description: {
        component: "The public representation of an editable Interests Content Block containing an ordered array of Tags. Every Chip opens the Videos page filtered by its Tag.",
      },
    },
  },
  argTypes: {
    section_heading: { control: "text" },
    section_description: { control: "text" },
  },
  args: {
    section_heading: SECTION_HEADING,
    section_description: SECTION_DESCRIPTION,
  },
};

export const default_story = {};
