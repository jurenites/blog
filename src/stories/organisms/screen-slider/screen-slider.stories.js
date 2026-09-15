import { screen_slider_markup } from './screen-slider.markup.js';
import { initialize_screen_sliders } from '../../../slice/src/js/screen-slider.js';

const SCREEN_NAMES = [
  "v0.2_Main_Play_Screens 3.png",
  "v0.2_Main_Play_Screens 5-1.png",
  "v0.2_Main_Play_Screens 5.png",
  "v0.2_Main_Play_Screens 6-1.png",
  "v0.2_Main_Play_Screens 6.png",
  "v0.2_Main_Play_Screens 8.png",
  "v0.2_Main_Play_Screens 9.png",
  "v0.2_Main_Play_Screens 10.png",
  "v0.2_Main_Play_Screens 11.png",
  "v0.2_Main_Play_Screens 12.png",
  "v0.3_Other_project_Samples 2.png",
  "v0.4_Screens 3.png",
  "v0.4_Screens 4.png",
  "v0.4_Screens 23.png",
  "v0.5_Screens 2-1.png",
  "v0.5_Screens 2-2.png",
  "v0.5_Screens 2.png",
  "v0.5_Screens 3.png",
  "v0.5_Screens 6.png",
  "v0.8_Screens 1-1.png",
  "v0.8_Screens 1.png",
  "v0.8_Screens 2.png",
  "v0.8_Screens 15.png",
  "v0.8_Screens 16.png",
  "v0.8_Screens 17.png",
  "v0.8_Screens 18.png",
  "v0.8_Screens 19.png",
  "v0.8_Screens 20.png",
  "v0.8_Screens 21.png",
  "v0.8_Screens 22.png",
  "v0.9_Screens 1-1.png",
  "v0.9_Screens 1.png",
  "v0.9_Screens 2.png",
  "v0.9_Screens 3-1.png",
  "v0.9_Screens 3.png",
  "v0.9_Screens 4-1.png",
  "v0.9_Screens 4.png",
  "v0.9_Screens 5-1.png",
  "v0.9_Screens 5-2.png",
  "v0.9_Screens 5.png",
  "v0.9_Screens 6-1.png",
  "v0.9_Screens 6.png"
];
const SCREEN_IMAGES = SCREEN_NAMES.map((file_name) => ({ image_url: `/assets/images/projects/smep/screens/${encodeURIComponent(file_name)}`, image_alt: `SMEP interface — ${file_name}` }));

export default {
  title: 'Organisms/Screen Slider',
  tags: ['autodocs'],
  args: { screen_images: SCREEN_IMAGES },
  render: screen_slider_markup,
  play: ({ canvasElement: canvas_element }) => initialize_screen_sliders(canvas_element),
};

export const default_story = {};
