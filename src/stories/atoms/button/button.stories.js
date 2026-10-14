import { BUTTON_PREVIEW_STATE, BUTTON_COMPONENT_PREVIEW, BUTTON_COMBINATION_PREVIEW, initialize_button_preview } from '../../../../.storybook/button-preview.js';
// Atom: Button. One story; use the Controls tab for every variant combination.
import { button_markup } from './button.markup.js';
import { button_style_args, BUTTON_STYLE_OPTIONS } from './button.states.js';

const BUTTON_LABEL = 'Contact me';
const BUTTON_STYLE = 'primary';
const IS_DISABLED = false;

function render_story(story_args) {
  window.requestAnimationFrame(initialize_button_preview);
  if (BUTTON_COMBINATION_PREVIEW) return `<div class="button-combination-preview" role="list" aria-label="Button combinations">${BUTTON_STYLE_OPTIONS.flatMap(button_style => [false, true].map(is_disabled => `<div class="button-combination-preview__item" role="listitem" aria-label="${button_style} · ${is_disabled ? 'disabled' : 'enabled'}">${button_markup(button_style_args({ ...story_args, button_style, is_disabled }))}</div>`)).join('')}</div>`;
  return button_markup(button_style_args(story_args));
}

export default {
  title: 'Atoms/Button',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    pseudo: { hover: BUTTON_PREVIEW_STATE === 'hover' ? '.button' : false, focusVisible: BUTTON_PREVIEW_STATE === 'focus' ? '.button' : false, focus: BUTTON_PREVIEW_STATE === 'focus' ? '.button' : false, active: BUTTON_PREVIEW_STATE === 'active' ? '.button' : false },
    preview_watermark: { disabled: BUTTON_COMPONENT_PREVIEW },
  },
  render: render_story,
  argTypes: {
    button_label: { control: 'text' },
    button_style: {
      description: 'Matches the Figma button_style variant property. All styles are borderless.',
      control: { type: 'inline-radio' },
      options: BUTTON_STYLE_OPTIONS,
    },
    is_disabled: {
      description: 'Native disabled state. Disabled buttons do not respond to hover.',
      control: 'boolean',
    },
  },
  args: {
    button_label: BUTTON_LABEL,
    button_style: BUTTON_STYLE,
    is_disabled: IS_DISABLED,
  },
};

export const default_story = {};
