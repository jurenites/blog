import { game_of_life_markup } from './game-of-life.markup.js';

const PAUSE_LABEL = 'Pause simulation';
const PLAY_LABEL = 'Play simulation';
const PREVIEW_SIZE = 'detail';

export default {
  title: 'Organisms/Game of Life',
  tags: ['autodocs'],
  render: game_of_life_markup,
  args: { pause_label: PAUSE_LABEL, play_label: PLAY_LABEL, preview_size: PREVIEW_SIZE },
  argTypes: { preview_size: { control: 'select', options: ['detail', 'thumbnail'] } },
};

export const default_story = {};
export const thumbnail_preview = { args: { preview_size: 'thumbnail' } };
