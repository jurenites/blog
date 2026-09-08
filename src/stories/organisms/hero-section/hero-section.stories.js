import { hero_section_markup } from "./hero-section.markup.js";

const SECTION_LABEL = "Introduction";
const EYEBROW_HEADING = "Design. Build. Collaborate.";
const BACKGROUND_IMAGE_URL = "/assets/images/hero-night.jpg";
const IMAGE_DESCRIPTION = "Working at a laptop, illuminated by the screen at night.";
const GLOW_ENABLED = true;
const HERO_SLIDES = [
  {
    navigation_label: "Collaborate",
    slide_heading: "Let’s build something together.",
    slide_description: "Have an idea in mind? Let’s make it something people use.",
    primary_label: "Contact me", primary_url: "/contact",
    secondary_label: "Explore my work", secondary_url: "/portfolio",
  },
  {
    navigation_label: "About me",
    slide_heading: "The mind behind the work.",
    slide_description: "Meet the person behind the projects—and see the experience that shaped them.",
    primary_label: "About me", primary_url: "/about",
    secondary_label: "Contact me", secondary_url: "/contact",
  },
  {
    navigation_label: "My work",
    slide_heading: "From an idea to something real.",
    slide_description: "Explore selected projects and the decisions behind them.",
    primary_label: "Explore my work", primary_url: "/portfolio",
    secondary_label: "Contact me", secondary_url: "/contact",
  },
];

export default {
  title: "Organisms/Hero Section",
  tags: ["autodocs"],
  render: hero_section_markup,
  parameters: {
    docs: { description: { component: "Editable photographic Hero block. Manual tabs change the text and links; hover or keyboard focus reveals subtle CSS ray beams clipped to the laptop screen edge. Beams fade before the person, without face or shirt reflection overlays. There is no autoplay. The beam geometry follows the supplied photograph and can be disabled for other images. Without JavaScript all slides remain readable. On narrow screens text follows the image." } },
  },
  args: {
    section_label: SECTION_LABEL,
    eyebrow_heading: EYEBROW_HEADING,
    background_image_url: BACKGROUND_IMAGE_URL,
    image_description: IMAGE_DESCRIPTION,
    glow_enabled: GLOW_ENABLED,
    hero_slides: HERO_SLIDES,
  },
  argTypes: {
    section_label: { control: "text" },
    eyebrow_heading: { control: "text" },
    background_image_url: { control: "text" },
    image_description: { control: "text" },
    glow_enabled: { control: "boolean" },
    hero_slides: { control: "object" },
  },
};

export const default_story = {};
export const single_slide = { args: { hero_slides: HERO_SLIDES.slice(0, 1) } };
export const without_image = { args: { background_image_url: "" } };
export const without_glow = { args: { glow_enabled: false } };
