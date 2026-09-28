import CARD_DOCUMENTATION from './card.docs.md?raw';
import { create as create_storybook_theme } from '@storybook/theming/create';
import SCATCHAPP_HTML from '../../../../generated/content/scatchapp-detail-preview.html?raw';
import { card_markup } from './card.markup.js';
import { initialize_cursor_cards, detach_cursor_cards } from '../../../slice/src/js/cursor-card.js';
import { initialize_dynamic_thumbnails, detach_dynamic_thumbnails } from '../../../slice/src/js/dynamic-thumbnail.js';
import GIF_RECORDING from '../../../public/assets/images/projects/skatch/map-list-gif.json';

const CARD_LABEL = 'View AMI mobile screens';
const CARD_URL = '/assets/images/projects/ami/ami_accounts-full.png';
const FALLBACK_SOURCE = '/assets/images/projects/ami/ami_accounts-full.png';
const DISPLAY_SIZE = 'thumbnail';
const DISPLAY_OPTIONS = ['thumbnail', 'native-screen'];
const BACKGROUND_MODE = 'gradient';
const BACKGROUND_OPTIONS = ['gradient', 'transparent'];
const FOLLOW_CURSOR = true;
const ISLAND_OVERLAY = true;
const FADE_DURATION_MS = 450;
const IS_PLAYING = true;
const IPHONE_ERA = 'modern';
const ERA_OPTIONS = ['modern', 'classic'];
const FRAME_LIST = [
  { image_source: '/assets/images/projects/ami/ami_splash.png', image_description: 'AMI splash screen.', frame_mode: 'still', hold_ms: 900 },
  { image_source: '/assets/images/projects/ami/ami_pin.png', image_description: 'AMI passcode screen.', frame_mode: 'still', hold_ms: 1800 },
  { image_source: '/assets/images/projects/ami/ami_accounts_empty.png', image_description: 'AMI empty accounts.', island_overlay: false, frame_mode: 'scroll', hold_ms: 1800, scroll_speed: 70, bottom_hold_ms: 800 },
  { image_source: '/assets/images/projects/ami/ami_accounts-full.png', image_description: 'AMI funded accounts.', island_overlay: false, frame_mode: 'scroll', hold_ms: 2200, scroll_speed: 70, bottom_hold_ms: 1000 },
  { video_source: '/assets/videos/skatch-app-list.mp4', image_description: 'Skatch app list recording.', frame_mode: 'video', video_fit: 'cover', hold_ms: 0 },
  { ...GIF_RECORDING, image_description: 'Skatch map and list animation.', frame_mode: 'gif', hold_ms: 4000 },
];
const SCREEN_PRESET = 'compact-screen';
const SCREEN_OPTIONS = ['compact-screen', 'large-screen'];

function render_phone_story(story_arguments) {
  const story_container = document.createElement('div');
  story_container.className = `storybook-stack${story_arguments.display_size === 'native-screen' ? '' : ' storybook-stack--narrow'}`;
  story_container.innerHTML = card_markup(story_arguments);
  // Controls replace this node without rerunning Storybook's play callback.
  window.requestAnimationFrame(() => {
    if (!story_container.isConnected) return;
    initialize_cursor_cards(story_container);
    initialize_dynamic_thumbnails(story_container);
    const removal_observer = new MutationObserver(() => {
      if (story_container.isConnected) return;
      detach_cursor_cards(story_container);
      detach_dynamic_thumbnails(story_container);
      removal_observer.disconnect();
    });
    removal_observer.observe(story_container.parentNode, { childList: true });
  });
  return story_container;
}

export default {
  title: 'Molecules/Preview Mobile Screen Card',
  tags: ['autodocs'],
  parameters: {
    docs: {
      theme: create_storybook_theme({ base: 'dark' }),
      description: { component: `${CARD_DOCUMENTATION}\n\n\`\`\`html\n${SCATCHAPP_HTML}\n\`\`\`` },
      source: { transform: (source_text, story_context) => card_markup(story_context.args) },
    },
  },
  args: {
    card_label: CARD_LABEL,
    card_url: CARD_URL,
    fallback_source: FALLBACK_SOURCE,
    display_size: DISPLAY_SIZE,
    background_mode: BACKGROUND_MODE,
    follow_cursor: FOLLOW_CURSOR,
    island_overlay: ISLAND_OVERLAY,
    frame_list: FRAME_LIST,
    fade_duration_ms: FADE_DURATION_MS,
    is_playing: IS_PLAYING,
    screen_preset: SCREEN_PRESET,
    iphone_era: IPHONE_ERA,
  },
  argTypes: {
    card_label: { control: 'text' },
    card_url: { control: 'text', description: 'Optional destination. Clear it to render a non-clickable preview without hover effects or cursor tracking; media playback continues.' },
    fallback_source: { control: 'text', description: 'Static screen poster shown before JavaScript initializes or when scripts are unavailable. Required for a video-only sequence without a poster.' },
    display_size: { control: 'select', options: DISPLAY_OPTIONS, description: 'Thumbnail: square tile. Native screen: 375px or 414px display plus the case and 32px tilt clearance on each side, shrinking only to fit smaller containers.' },
    background_mode: { control: 'select', options: BACKGROUND_OPTIONS, description: 'The background tile is optional and independent of phone size and playback.' },
    follow_cursor: { control: 'boolean', description: 'When a destination URL is set, follow the pointer with perspective and light, or keep the phone facing straight ahead. False avoids pointer-tracking work and extra depth layers.' },
    island_overlay: { control: 'boolean', description: 'Modern phones: reserve the top 56 screen pixels for the Dynamic Island. Still images fit below it; scrolling images pass behind it. The first image pixel row fills the band. Each frame may override island_overlay; disable it for screenshots with their own status bar or cutout.' },
    frame_list: { control: 'object', description: 'Frames: still, scroll, video, or gif. GIF uses generated sprite source, width, height and original frame durations. hold_ms controls visible duration; video 0 plays to the end.' },
    fade_duration_ms: { control: { type: 'number', min: 0, max: 3000 } },
    is_playing: { control: 'boolean' },
    screen_preset: { control: 'select', options: SCREEN_OPTIONS },
    iphone_era: { control: 'select', options: ERA_OPTIONS, description: 'Classic: home button, 375×667 or 414×736. Modern: edge-to-edge, 375×812 or 414×896.' },
  },
  render: render_phone_story,
};

export const phone_preview = {};
