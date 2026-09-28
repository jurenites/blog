import { site_header_markup } from '../site-header/site-header.markup.js';
import { button_markup } from '../../atoms/button/button.markup.js';
import { reveal_loading_name } from '../../../slice/src/js/loading-name.js';
import '../../../slice/src/scss/drupal/_site-intro.scss';
import './loading-name.scss';

const FIRST_NAME = 'Alexander';
const LAST_NAME = 'Ilivanov';
const TOTAL_DURATION = 2000;
const CHARACTER_DURATION = 325;
const CHARACTER_STAGGER = 25;
const BLUR_RADIUS = 12;
const REPLAY_LABEL = 'Replay animation';

function render_story(story_args) {
  const story_element = document.createElement('div');
  story_element.className = 'loading-name';
  const full_name = `${story_args.first_name} ${story_args.last_name}`.trim();
  story_element.innerHTML = `<div class="loading-name__stage">${site_header_markup({
    brand_name: full_name,
    brand_full_name: full_name,
    navigation_labels: 'Home, About, Portfolio, Blog, Contact',
    language_labels: 'Eng, Rus',
  })}</div><div class="loading-name__controls">${button_markup({ button_label: REPLAY_LABEL })}</div>`;
  const brand_link = story_element.querySelector('.site-header__brand');
  const branding_element = document.createElement('div');
  branding_element.className = 'loading-name__branding';
  brand_link.before(branding_element);
  branding_element.append(brand_link);
  let cancel_reveal = () => {};
  let completion_timeout;
  const replay_animation = () => {
    cancel_reveal();
    clearTimeout(completion_timeout);
    story_element.removeAttribute('data-site-intro');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    void story_element.offsetWidth;
    story_element.setAttribute('data-site-intro', 'running');
    story_element.getAnimations({ subtree: true }).forEach((intro_animation) => {
      if (intro_animation.animationName?.startsWith('site-intro-')) {
        intro_animation.effect.updateTiming({ duration: story_args.total_duration });
      }
    });
    cancel_reveal = reveal_loading_name(branding_element, story_args);
    completion_timeout = setTimeout(() => {
      cancel_reveal();
      story_element.removeAttribute('data-site-intro');
    }, story_args.total_duration);
  };
  story_element.querySelector('.loading-name__controls button').addEventListener('click', replay_animation);
  // Start only after Storybook has mounted the returned element and fonts are ready.
  document.fonts.ready.then(() => requestAnimationFrame(() => {
    if (story_element.isConnected) replay_animation();
  }));
  return story_element;
}

export default {
  title: 'Organisms/Loading Name',
  render: render_story,
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: 'The entry-page name animation with per-character blur. Timing values are milliseconds; blur is pixels. Long reveals fit into the first 40% of the full sequence. Controls are preview-only; Drupal uses the existing brand motion tokens.' } },
  },
  args: { first_name: FIRST_NAME, last_name: LAST_NAME, total_duration: TOTAL_DURATION, character_duration: CHARACTER_DURATION, character_stagger: CHARACTER_STAGGER, blur_radius: BLUR_RADIUS },
  argTypes: {
    first_name: { control: 'text' },
    last_name: { control: 'text' },
    total_duration: { control: { type: 'range', min: 500, max: 6000, step: 100 } },
    character_duration: { control: { type: 'range', min: 0, max: 1500, step: 25 } },
    character_stagger: { control: { type: 'range', min: 0, max: 150, step: 5 } },
    blur_radius: { control: { type: 'range', min: 0, max: 48, step: 1 } },
  },
};

export const default_story = {};
