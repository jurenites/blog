import { dynamic_thumbnail_markup } from './dynamic-thumbnail.markup.js';
import { initialize_dynamic_thumbnails, detach_dynamic_thumbnails } from '../../../slice/src/js/dynamic-thumbnail.js';

const ARTWORK_NAME = 'roundabout';
const ARTWORK_OPTIONS = ['roundabout', '4pixel', 'smep', 'oksenate'];

export default {
  title: 'Molecules/Porfolio/Dynamic Thumbnail',
  tags: ['autodocs'],
  args: { artwork_name: ARTWORK_NAME },
  argTypes: { artwork_name: { control: 'select', options: ARTWORK_OPTIONS } },
  render: dynamic_thumbnail_markup,
  play: ({ canvasElement: canvas_element }) => {
    detach_dynamic_thumbnails(document);
    initialize_dynamic_thumbnails(canvas_element);
  },
};

export const roundabout_preview = {};
export const pixel_preview = { args: { artwork_name: ARTWORK_OPTIONS[1] } };
export const smep_preview = { args: { artwork_name: ARTWORK_OPTIONS[2] } };
export const oksenate_preview = { args: { artwork_name: ARTWORK_OPTIONS[3] } };
