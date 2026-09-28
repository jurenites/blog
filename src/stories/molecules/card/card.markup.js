import card_template from './card.template.html?raw';
import { escape_html, render_template } from '../../template.js';
import { phone_preview_markup } from './phone-preview.markup.js';
import { background_tile_markup } from './background-tile.markup.js';

export function card_markup(card_arguments) {
  const display_size = card_arguments.display_size === 'native-screen' ? 'native-screen' : 'thumbnail';
  const background_mode = card_arguments.background_mode === 'transparent' ? 'transparent' : 'gradient';
  const screen_preset = card_arguments.screen_preset === 'large-screen' ? 'large-screen' : 'compact-screen';
  const iphone_era = card_arguments.iphone_era === 'classic' ? 'classic' : 'modern';
  const card_url = String(card_arguments.card_url ?? '').trim();
  const follow_cursor = Boolean(card_url) && card_arguments.follow_cursor !== false;
  const card_classes = `card card--${display_size} card--${background_mode} card--${screen_preset} card--${iphone_era}`;
  const card_attributes = `class="${card_classes}" data-cursor-card data-follow-cursor="${follow_cursor}"`;
  return render_template(card_template, {
    card_opening: card_url
      ? `<a ${card_attributes} href="${escape_html(card_url)}" aria-label="${escape_html(card_arguments.card_label)}">`
      : `<div ${card_attributes}>`,
    card_closing: card_url ? '</a>' : '</div>',
    background_markup: background_mode === 'gradient' ? background_tile_markup(follow_cursor) : '',
    phone_markup: phone_preview_markup({ ...card_arguments, follow_cursor }),
  });
}
