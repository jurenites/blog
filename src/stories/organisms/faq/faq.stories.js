import faq_template from "./faq.template.html?raw";
import faq_item_template from "./faq-item.template.html?raw";
import { two_tone_heading_markup } from "../../atoms/two-tone-heading/two-tone-heading.markup.js";
import { escape_html, render_template } from "../../template.js";

const HEADING_TEXT = "Questions?";
const SUBHEADING_TEXT = "Here are answers.";
const FIRST_QUESTION = "How do you run projects?";
const FIRST_ANSWER = "I begin by getting to know your goals, then turn them into a design plan with weekly milestones. Regular progress notes, async check-ins, and timely replies keep you involved without having to manage every detail.";
const SECOND_QUESTION = "Can we hop on calls?";
const SECOND_ANSWER = "Absolutely. We begin with a strategy call to agree on the direction. From there, most updates happen asynchronously so we can stay focused. Whenever a conversation would help us move forward, we can arrange a call.";
const FIRST_OPEN = true;

function render_story(story_args) {
  const faq_items = [
    { question_text: story_args.first_question, answer_text: story_args.first_answer },
    { question_text: story_args.second_question, answer_text: story_args.second_answer },
  ];
  return render_template(faq_template, {
    heading_markup: two_tone_heading_markup({
      heading_level: "h2", leading_text: story_args.heading_text,
      soft_text: story_args.subheading_text, soft_text_placement: "new-line",
    }),
    faq_items_markup: faq_items.map((faq_item, item_index) => render_template(faq_item_template, {
      item_number: item_index + 1,
      question_text: escape_html(faq_item.question_text),
      answer_text: escape_html(faq_item.answer_text),
      answer_link_markup: item_index === 0 ? ' Explore my <a href="/cookbook">Cookbook</a> for a closer look at the process.' : "",
      open_attribute: item_index === 0 && story_args.first_open ? " open" : "",
    })).join(""),
  });
}

export default {
  title: "Organisms/Section/FAQ",
  tags: ["autodocs"],
  render: render_story,
  argTypes: {
    heading_text: { control: "text" },
    subheading_text: { control: "text" },
    first_question: { control: "text" },
    first_answer: { control: "text" },
    second_question: { control: "text" },
    second_answer: { control: "text" },
    first_open: { control: "boolean" },
  },
  args: {
    heading_text: HEADING_TEXT,
    subheading_text: SUBHEADING_TEXT,
    first_question: FIRST_QUESTION,
    first_answer: FIRST_ANSWER,
    second_question: SECOND_QUESTION,
    second_answer: SECOND_ANSWER,
    first_open: FIRST_OPEN,
  },
};

export const default_story = {};
export const all_closed = { args: { first_open: false } };
