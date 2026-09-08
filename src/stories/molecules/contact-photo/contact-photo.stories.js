import photo_template from './contact-photo.template.html?raw';
import { escape_html, render_template } from '../../template.js';

const IMAGE_URL = '/assets/images/contact-desk-cold-v1.jpg';
const IMAGE_DESCRIPTION = 'Working at a desk with two monitors and a laptop, seen from behind in cool evening light.';

function contact_photo_markup({ image_url, image_description }) {
  return image_url ? render_template(photo_template, {
    image_url: escape_html(image_url), image_description: escape_html(image_description),
  }) : '';
}

export default {
  title: 'Molecules/Contact Photo', tags: ['autodocs'], render: contact_photo_markup,
  args: { image_url: IMAGE_URL, image_description: IMAGE_DESCRIPTION },
  argTypes: { image_url: { control: 'text' }, image_description: { control: 'text' } },
  parameters: { docs: { description: { component: 'A complete retouched photograph below the Contact form. The full image scales down without cropping the hands or desk. Drupal exposes an editable image block with standard placement controls.' } } },
};

export const default_story = {};
