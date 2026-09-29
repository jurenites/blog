import { create_accountia_preview } from './accountia-case-study.markup.js';
import './accountia-case-study.scss';

const PROJECT_TITLE = 'Accountia';
const PROJECT_DESCRIPTION = 'Mobile screens';
const DISPLAY_SIZE = 'thumbnail';
const BACKGROUND_MODE = 'gradient';
const SCREEN_PRESET = 'compact-screen';
const IPHONE_ERA = 'modern';
const IS_PLAYING = true;
const SCREEN_LIST = [
  { asset_key: 'mobile-dashboard', screen_title: 'Dashboard' },
  { asset_key: 'mobile-products', screen_title: 'Products' },
  { asset_key: 'mobile-product', screen_title: 'Product details' },
  { asset_key: 'mobile-suppliers', screen_title: 'Suppliers' },
  { asset_key: 'mobile-employees', screen_title: 'Employees' },
  { asset_key: 'mobile-fees', screen_title: 'Fees' },
];

export default {
  title: 'Pages/Accountia Case Study',
  parameters: { layout: 'fullscreen', preview_watermark: { disabled: true } },
  args: {
    project_title: PROJECT_TITLE,
    project_description: PROJECT_DESCRIPTION,
    screen_list: SCREEN_LIST,
    display_size: DISPLAY_SIZE,
    background_mode: BACKGROUND_MODE,
    screen_preset: SCREEN_PRESET,
    iphone_era: IPHONE_ERA,
    is_playing: IS_PLAYING,
  },
  argTypes: {
    display_size: { control: 'select', options: ['thumbnail', 'native-screen'] },
    background_mode: { control: 'select', options: ['gradient', 'transparent'] },
    iphone_era: { control: 'select', options: ['modern', 'classic'] },
    screen_preset: { control: 'select', options: ['compact-screen', 'large-screen'] },
    is_playing: { control: 'boolean' },
  },
  render: create_accountia_preview,
};

export const project_overview = {};
