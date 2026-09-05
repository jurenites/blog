import { initialize_font_previews } from './font-preview.js';

if (typeof Drupal !== 'undefined') {
  Drupal.behaviors.jurenites_font_preview = {
    attach(font_preview_context) {
      initialize_font_previews(font_preview_context);
    },
  };
}
