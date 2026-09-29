import thumbnail_template from './dynamic-thumbnail.template.html?raw';
import roundabout_artwork from '../../../public/assets/images/dynamic-thumbnails/roundabout.svg?raw';
import pixel_artwork from '../../../public/assets/images/dynamic-thumbnails/4pixel.svg?raw';
import smep_artwork from '../../../public/assets/images/dynamic-thumbnails/smep.svg?raw';
import oksenate_artwork from '../../../public/assets/images/dynamic-thumbnails/oksenate.svg?raw';
import { render_template } from '../../template.js';

const ARTWORK_SOURCES = { roundabout: roundabout_artwork, '4pixel': pixel_artwork, smep: smep_artwork, oksenate: oksenate_artwork };
let thumbnail_sequence = 0;

export function dynamic_thumbnail_markup({ artwork_name = 'roundabout' } = {}) {
  const id_prefix = `story-thumbnail-${++thumbnail_sequence}-`;
  const artwork_markup = (ARTWORK_SOURCES[artwork_name] || roundabout_artwork)
    .replace('<svg ', '<svg class="dynamic-thumbnail__artwork" aria-hidden="true" focusable="false" ')
    .replace(/id="level_([0-9]+)((?:_[\w-]+)?)"/g, 'data-thumbnail-depth="$1" id="level_$1$2"')
    .replace('id="background_highlight"', 'data-thumbnail-highlight="" id="background_highlight"')
    .replace(/id="([^"]+)"/g, `id="${id_prefix}$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${id_prefix}$1)`)
    .replace(/href="#([^"]+)"/g, `href="#${id_prefix}$1"`);
  return render_template(thumbnail_template, { artwork_markup });
}
