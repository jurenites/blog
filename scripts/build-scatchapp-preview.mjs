import { mkdir as make_directory, writeFile as write_file } from 'node:fs/promises';
import { createServer as create_vite_server } from 'vite';

// Reuse the Storybook component so CMS markup follows the same phone contract.
const vite_server = await create_vite_server({ configFile: false, server: { middlewareMode: true, hmr: false }, appType: 'custom' });
try {
  const { card_markup } = await vite_server.ssrLoadModule('/src/stories/molecules/card/card.markup.js');
  const asset_root = '/themes/custom/jurenites_theme/assets';
  const preview_arguments = {
    card_label: 'Read the ScatchApp project note',
    card_url: '/portfolio/scatchapp',
    display_size: 'thumbnail',
    background_mode: 'gradient',
    screen_preset: 'compact-screen',
    iphone_era: 'modern',
    follow_cursor: true,
    island_overlay: false,
    fallback_source: `${asset_root}/images/projects/scatchapp/map-poster.png`,
    is_playing: true,
    fade_duration_ms: 450,
    frame_list: [
      { frame_mode: 'video', video_source: `${asset_root}/videos/scatchapp/list.mp4`, image_description: 'ScatchApp map and event list design recording', video_fit: 'cover', hold_ms: 0 },
      { frame_mode: 'video', video_source: `${asset_root}/videos/scatchapp/filter.mp4`, image_description: 'ScatchApp event filter design recording', video_fit: 'cover', hold_ms: 0 },
    ],
  };
  const preview_markup = card_markup(preview_arguments);
  const detail_markup = card_markup({
    ...preview_arguments,
    card_label: 'ScatchApp map, list and filter recordings',
    card_url: '',
    display_size: 'native-screen',
    background_mode: 'transparent',
  });
  await make_directory(new URL('../generated/content/', import.meta.url), { recursive: true });
  await write_file(new URL('../generated/content/scatchapp-preview.html', import.meta.url), preview_markup);
  await write_file(new URL('../generated/content/scatchapp-detail-preview.html', import.meta.url), detail_markup);
} finally {
  await vite_server.close();
}
