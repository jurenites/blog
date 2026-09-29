import { card_markup } from '../../molecules/card/card.markup.js';
import { escape_html } from '../../template.js';
import asset_map from './accountia-assets.json';
import { initialize_accountia_preview } from './accountia-case-study.runtime.js';

export function create_accountia_preview(story_args) {
  const root_element = document.createElement('main');
  root_element.className = 'accountia-case';
  const selected_screens = story_args.screen_list.filter(screen_item => asset_map[screen_item.asset_key]?.pixel_width === 360);
  root_element.innerHTML = `<header class="accountia-case__heading"><h1>${escape_html(story_args.project_title)}</h1><p>${escape_html(story_args.project_description)}</p></header>
    <div class="accountia-case__grid" id="mobile-work">${selected_screens.map(screen_item => {
      const screen_asset = asset_map[screen_item.asset_key];
      return `<figure class="accountia-case__item">${card_markup({
        card_label: `View ${screen_item.screen_title} full screen`,
        card_url: screen_asset.image_url,
        fallback_source: screen_asset.image_url,
        display_size: story_args.display_size,
        background_mode: story_args.background_mode,
        screen_preset: story_args.screen_preset,
        iphone_era: story_args.iphone_era,
        is_playing: story_args.is_playing,
        fade_duration_ms: 450,
        frame_list: [{ image_source: screen_asset.image_url, image_description: screen_item.screen_title, frame_mode: 'scroll', hold_ms: 1800, scroll_speed: 70, bottom_hold_ms: 1000 }],
      })}<figcaption class="accountia-case__caption">${escape_html(screen_item.screen_title)}</figcaption></figure>`;
    }).join('')}</div>`;
  initialize_accountia_preview(root_element);
  return root_element;
}
