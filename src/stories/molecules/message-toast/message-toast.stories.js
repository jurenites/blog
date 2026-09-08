import { create_message_toast, initialize_message_toasts } from '../../../slice/src/js/message-toast.js';

const MESSAGE_TEXT = 'Your changes have been saved.';
const MESSAGE_TYPE = 'status';
const MESSAGE_LABELS = { status: 'Status message', warning: 'Warning message', error: 'Error message' };
const DISMISS_LABEL = 'Dismiss message';

function render_story(story_args) {
  const message_region = document.createElement('div');
  message_region.setAttribute('data-drupal-messages', '');
  message_region.append(create_message_toast(
    story_args.message_text,
    { type: story_args.message_type, id: 'storybook-message-toast' },
    MESSAGE_LABELS,
    story_args.dismiss_label,
  ));
  initialize_message_toasts(message_region);
  return message_region;
}

export default {
  title: 'Molecules/Message Toast',
  tags: ['autodocs'],
  render: render_story,
  args: { message_text: MESSAGE_TEXT, message_type: MESSAGE_TYPE, dismiss_label: DISMISS_LABEL },
  argTypes: {
    message_text: { control: 'text' },
    message_type: { control: 'select', options: ['status', 'warning', 'error'] },
    dismiss_label: { control: 'text' },
  },
};

export const status_message = {};
export const warning_message = { args: { message_type: 'warning' } };
export const error_message = { args: { message_type: 'error' } };
