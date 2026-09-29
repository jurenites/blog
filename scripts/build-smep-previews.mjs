import { mkdir as make_directory, readdir as read_directory, copyFile as copy_file, writeFile as write_file } from 'node:fs/promises';
import { createServer as create_vite_server } from 'vite';

const source_root = process.argv[2] || '/Users/alexanderilivanov/Downloads/smep';
const preview_groups = [
  { source_folder: 'real_screens', group_name: 'element-cards', preview_label: 'SMEP element cards and research screens', section_uuid: '3285d847-e0a4-49da-85fe-6b1024310696' },
  { source_folder: 'abstract_screens', group_name: 'playground', preview_label: 'SMEP abstract playground explorations', section_uuid: '12387af7-6c34-4529-9482-c65544044b68' },
  { source_folder: 'details_orbitals', group_name: 'orbitals', preview_label: 'SMEP atomic orbital details', section_uuid: '57d43c49-0e58-4b91-a7c6-6dda19425177' },
  { source_folder: 'Guideline', group_name: 'guidelines', preview_label: 'SMEP typography and interface guidelines', section_uuid: '23ab2412-a8d8-40c0-83e0-c3f9c74ce1aa' },
];
const vite_server = await create_vite_server({ configFile: false, optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
try {
  const { card_markup } = await vite_server.ssrLoadModule('/src/stories/molecules/card/card.markup.js');
  for (const preview_group of preview_groups) {
    const source_names = (await read_directory(`${source_root}/${preview_group.source_folder}`)).filter(file_name => file_name.endsWith('.png')).sort((first_name, second_name) => first_name.localeCompare(second_name, 'en', { numeric: true }));
    if (!source_names.length) throw new Error(`No screens in ${preview_group.source_folder}`);
    const asset_folder = `src/public/assets/images/projects/smep/${preview_group.group_name}`;
    await make_directory(asset_folder, { recursive: true });
    const frame_list = [];
    for (const [source_index, source_name] of source_names.entries()) {
      const asset_name = `${String(source_index + 1).padStart(2, '0')}-${source_name.replace(/\.png$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '')}.png`;
      await copy_file(`${source_root}/${preview_group.source_folder}/${source_name}`, `${asset_folder}/${asset_name}`);
      frame_list.push({ image_source: `/themes/custom/jurenites_theme/assets/images/projects/smep/${preview_group.group_name}/${asset_name}`, image_description: `SMEP: ${source_name.replace(/\.png$/, '')}`, frame_mode: 'scroll', hold_ms: 2400, scroll_behavior: 'swipe', bottom_hold_ms: 1000 });
    }
    preview_group.frame_count = frame_list.length;
    preview_group.preview_markup = `<div data-phone-preview data-smep-preview="${preview_group.group_name}">${card_markup({ display_size: 'thumbnail', background_mode: 'gradient', screen_preset: 'compact-screen', iphone_era: 'classic', follow_cursor: true, island_overlay: false, is_playing: true, fade_duration_ms: 450, fallback_source: frame_list[0].image_source, frame_list })}</div>`;
  }
  await make_directory('generated/content/smep', { recursive: true });
  await write_file('generated/content/smep/previews.json', `${JSON.stringify(preview_groups, null, 2)}\n`);
  console.log(preview_groups.map(preview_group => `${preview_group.group_name}: ${preview_group.frame_count} screens`).join('\n'));
} finally {
  await vite_server.close();
}
