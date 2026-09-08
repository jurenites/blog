import { layered_scene_markup } from './layered-scene.markup.js';

const SECTION_HEADING = 'Let’s get to work.';
const EYEBROW_HEADING = 'From the desk';
const SECTION_DESCRIPTION = 'Explore the projects, experiments, and decisions behind the work.';
const BACKGROUND_IMAGE_URL = '/assets/images/desk-arrival-background.jpg';
const BACKGROUND_DESCRIPTION = 'A clean desk with two monitors and an open laptop, lit in cool grayscale.';
// Cutout is withheld pending repairs to the hand, arm and color grade.
const FOREGROUND_IMAGE_URL = '';
const FOREGROUND_DESCRIPTION = 'Alexander working at the desk, seen from behind.';
const ARRIVAL_ENABLED = true;
const PRIMARY_LABEL = 'Explore projects';
const PRIMARY_URL = '/portfolio';
const SECONDARY_LABEL = 'Start a conversation';
const SECONDARY_URL = '/contact';
const CONTACT_HEADING = 'Your next idea starts here.';
const CONTACT_DESCRIPTION = 'Have something in mind? Tell me what you want to make.';
const CONTACT_LABEL = 'Contact me';
const CONTACT_URL = '/contact';
const ABOUT_HEADING = 'The person behind the projects.';
const ABOUT_DESCRIPTION = 'A closer look at how I work and what I’m learning.';
const ABOUT_LABEL = 'About me';
const ABOUT_URL = '/about';

export default {
  title: 'Organisms/Layered Scene',
  tags: ['autodocs'],
  render: layered_scene_markup,
  parameters: { docs: { description: { component: 'A fixed background with an aligned transparent foreground. The person fades in once after both images decode and the scene enters view, then remains visible. Reduced motion and animation-off show the final still. Upload two images with the same canvas and already aligned subjects; no photo-specific CSS transforms are needed. Editable Drupal content block with standard Block layout placement.' } } },
  args: {
    section_heading: SECTION_HEADING, eyebrow_heading: EYEBROW_HEADING, section_description: SECTION_DESCRIPTION,
    background_image_url: BACKGROUND_IMAGE_URL, background_description: BACKGROUND_DESCRIPTION,
    foreground_image_url: FOREGROUND_IMAGE_URL, foreground_description: FOREGROUND_DESCRIPTION,
    arrival_enabled: ARRIVAL_ENABLED, primary_label: PRIMARY_LABEL, primary_url: PRIMARY_URL,
    secondary_label: SECONDARY_LABEL, secondary_url: SECONDARY_URL,
  },
  argTypes: {
    section_heading: { control: 'text' }, eyebrow_heading: { control: 'text' }, section_description: { control: 'text' },
    background_image_url: { control: 'text' }, background_description: { control: 'text' },
    foreground_image_url: { control: 'text' }, foreground_description: { control: 'text' },
    arrival_enabled: { control: 'boolean' }, primary_label: { control: 'text' }, primary_url: { control: 'text' },
    secondary_label: { control: 'text' }, secondary_url: { control: 'text' },
  },
};

export const portfolio_entrance = {};
export const contact_invitation = { args: { section_heading: CONTACT_HEADING, section_description: CONTACT_DESCRIPTION, primary_label: CONTACT_LABEL, primary_url: CONTACT_URL, secondary_label: '', secondary_url: '' } };
export const about_the_process = { args: { section_heading: ABOUT_HEADING, section_description: ABOUT_DESCRIPTION, primary_label: ABOUT_LABEL, primary_url: ABOUT_URL } };
export const static_scene = { args: { arrival_enabled: false } };
export const background_only = { args: { foreground_image_url: '' } };
export const without_image = { args: { background_image_url: '', foreground_image_url: '' } };
