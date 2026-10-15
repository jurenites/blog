import { range_slider_markup } from './range-slider.markup.js';

const FIELD_ID = 'range-slider-demo';
const ACCESSIBLE_LABEL = 'Capture viewport';
const RANGE_VALUE = 2;
const RANGE_MIN = 0;
const RANGE_MAX = 3;
const RANGE_STEP = 1;
const SLIDER_ORIENTATION = 'horizontal';
const IS_DISABLED = false;

export default {
  title: 'Atoms/Range Slider',
  tags: ['autodocs'],
  render: range_slider_markup,
  args: { field_id: FIELD_ID, accessible_label: ACCESSIBLE_LABEL, range_value: RANGE_VALUE, range_min: RANGE_MIN, range_max: RANGE_MAX, range_step: RANGE_STEP, slider_orientation: SLIDER_ORIENTATION, is_disabled: IS_DISABLED },
  argTypes: { slider_orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] }, is_disabled: { control: 'boolean' } },
};

export const default_story = {};
export const vertical_story = { args: { slider_orientation: 'vertical', accessible_label: 'Viewport height', range_max: 5 } };
