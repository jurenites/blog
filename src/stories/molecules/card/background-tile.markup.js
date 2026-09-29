import background_template from './background-tile.template.html?raw';
import thumbnail_artwork from '../../../public/assets/images/dynamic-thumbnails/roundabout.svg?raw';
import { render_template } from '../../template.js';

let background_sequence = 0;

export function background_tile_markup(follow_cursor = true) {
  const gradient_identifier = `card-tile-${++background_sequence}`;
  const background_gradient = thumbnail_artwork
    .match(/<radialGradient id="background_highlight"[\s\S]*?<\/radialGradient>/)[0]
    .replace('id="background_highlight"', `id="${gradient_identifier}" data-thumbnail-highlight=""`);
  return render_template(background_template, { background_gradient, gradient_identifier,
    tracking_attribute: follow_cursor ? 'data-dynamic-thumbnail' : '',
  });
}
