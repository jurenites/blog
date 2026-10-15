import { icon_button_markup } from './icon-button.markup.js';
import { icon_markup } from '../icon/icon.markup.js';
import { button_style_args, BUTTON_STYLE_OPTIONS } from '../button/button.states.js';

const BUTTON_ACCESSIBLE_LABEL = 'Remove image';
const ICON_NAME = 'cross-big';
const BUTTON_STYLE = 'text';
const IS_DISABLED = false;
const ICON_OPTIONS = ['cross-big', 'gear', 'gear-filled', 'trash-can', 'plus', 'eye', 'eye-closed', 'chevron-down', 'pause-rect', 'play-triangle'];

function render_story({ icon_name, ...story_args }) {
  return icon_button_markup({
    ...button_style_args(story_args),
    button_icon_markup: icon_markup({ icon_name }),
  });
}

export default {
  title: 'Atoms/Icon-button',
  tags: ['autodocs'],
  render: render_story,
  argTypes: {
    button_accessible_label: { control: 'text' },
    icon_name: { control: 'select', options: ICON_OPTIONS },
    button_style: { control: 'inline-radio', options: BUTTON_STYLE_OPTIONS },
    is_disabled: { control: 'boolean' },
  },
  args: {
    button_accessible_label: BUTTON_ACCESSIBLE_LABEL,
    icon_name: ICON_NAME,
    button_style: BUTTON_STYLE,
    is_disabled: IS_DISABLED,
  },
};

export const default_story = {};
