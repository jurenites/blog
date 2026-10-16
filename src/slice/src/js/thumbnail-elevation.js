// Authored SVG geometry is the resting, fully raised composition.
// Animate inner groups so Drupal's depth wrappers keep exported transforms intact.
export function create_elevation_animations(artwork_element) {
  const scene_group = artwork_element.querySelector('.dynamic-thumbnail__elevation-scene');
  if (!scene_group) return [];
  const table_group = scene_group.querySelector('.dynamic-thumbnail__elevation-table');
  const dialog_group = scene_group.querySelector('.dynamic-thumbnail__elevation-dialog');
  const table_guide = scene_group.querySelector('.dynamic-thumbnail__elevation-guide-table');
  const dialog_guide = scene_group.querySelector('.dynamic-thumbnail__elevation-guide-dialog');
  const table_height = scene_group.querySelector('.dynamic-thumbnail__elevation-height-table')?.getBBox().height;
  const dialog_height = scene_group.querySelector('.dynamic-thumbnail__elevation-height-dialog')?.getBBox().height;
  if (![table_group, dialog_group, table_guide, dialog_guide].every(Boolean)
    || !Number.isFinite(table_height) || table_height <= 0
    || !Number.isFinite(dialog_height) || dialog_height <= 0) return [];

  const lift_frames = (height_value, start_time, end_time) => [
    { offset: 0, transform: `translateY(${height_value}px)` },
    { offset: start_time, transform: `translateY(${height_value}px)`, easing: 'cubic-bezier(.22, 1, .36, 1)' },
    { offset: end_time, transform: 'translateY(0px)' },
    { offset: 0.88, transform: 'translateY(0px)', easing: 'ease-in-out' },
    { offset: 1, transform: `translateY(${height_value}px)` },
  ];
  const reveal_frames = (start_time, end_time) => [
    { offset: 0, opacity: 0 },
    { offset: start_time, opacity: 0 },
    { offset: end_time, opacity: 1 },
    { offset: 0.82, opacity: 1 },
    { offset: 0.88, opacity: 0 },
    { offset: 1, opacity: 0 },
  ];
  const animation_specs = [
    [table_group, lift_frames(table_height, 0.1, 0.3)],
    [table_guide, reveal_frames(0.3, 0.37)],
    // The dialog appears on the already raised table, then lifts above it.
    [dialog_group, lift_frames(dialog_height, 0.44, 0.64)],
    [dialog_group, reveal_frames(0.4, 0.46)],
    [dialog_guide, reveal_frames(0.64, 0.71)],
  ];
  return animation_specs.map(([target_group, motion_frames]) => {
    const motion_animation = target_group.animate(motion_frames, { duration: 7000, iterations: Infinity });
    motion_animation.pause();
    return motion_animation;
  });
}
