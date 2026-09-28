import card_template from './card.template.html?raw';
import { escape_html, render_template } from '../../template.js';
import { phone_preview_markup } from './phone-preview.markup.js';
import { background_tile_markup } from './background-tile.markup.js';

export function card_markup(card_arguments) {
  const display_size = card_arguments.display_size === 'native-screen' ? 'native-screen' : 'thumbnail';
  const background_mode = card_arguments.background_mode === 'transparent' ? 'transparent' : 'gradient';
  const screen_preset = card_arguments.screen_preset === 'large-screen' ? 'large-screen' : 'compact-screen';
  const iphone_era = card_arguments.iphone_era === 'classic' ? 'classic' : 'modern';
  return render_template(card_template, {
    card_label: escape_html(card_arguments.card_label),
    card_url: escape_html(card_arguments.card_url),
    display_size, background_mode, screen_preset, iphone_era,
    follow_cursor: card_arguments.follow_cursor !== false,
    background_markup: background_mode === 'gradient' ? background_tile_markup(card_arguments.follow_cursor !== false) : '',
    phone_markup: phone_preview_markup(card_arguments),
  });
}
