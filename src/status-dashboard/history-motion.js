export const TRANSITION_DURATION = 2400;

export function pair_history_layers(before_data, after_data) {
  const before_layers = new Map(before_data.layer_rows.map((layer_row) => [layer_row.layer_id, layer_row]));
  const after_layers = new Map(after_data.layer_rows.map((layer_row) => [layer_row.layer_id, layer_row]));
  return [...new Set([...before_layers.keys(), ...after_layers.keys()])].map((layer_id) => ({ layer_id, before_layer: before_layers.get(layer_id), after_layer: after_layers.get(layer_id) }));
}

export function layer_keyframes(source_layer, destination_layer, { blueprint_mode = false, fade_direction = '' } = {}) {
  const source_bounds = source_layer.bounds_data;
  const destination_bounds = destination_layer.bounds_data;
  const source_depth = blueprint_mode ? source_layer.depth_level * 32 : 0;
  const destination_depth = blueprint_mode ? destination_layer.depth_level * 32 : 0;
  return [
    { transform: `translate3d(${source_bounds.x}px, ${source_bounds.y}px, ${source_depth}px) scale(1, 1)`, opacity: fade_direction === 'in' ? 0 : 1, borderRadius: blueprint_mode ? source_layer.corner_radius : '0px' },
    { transform: `translate3d(${destination_bounds.x}px, ${destination_bounds.y}px, ${destination_depth}px) scale(${destination_bounds.width / source_bounds.width}, ${destination_bounds.height / source_bounds.height})`, opacity: fade_direction === 'out' ? 0 : 1, borderRadius: blueprint_mode ? destination_layer.corner_radius : '0px' },
  ];
}

export function describe_layer_change(layer_pair) {
  if (!layer_pair.before_layer) return 'Added in After. Fades in.';
  if (!layer_pair.after_layer) return 'Removed in After. Fades out.';
  const before_bounds = layer_pair.before_layer.bounds_data;
  const after_bounds = layer_pair.after_layer.bounds_data;
  return `Movement: ${after_bounds.x - before_bounds.x}px horizontal, ${after_bounds.y - before_bounds.y}px vertical. Size: ${before_bounds.width} × ${before_bounds.height} → ${after_bounds.width} × ${after_bounds.height}px. Shape: ${layer_pair.before_layer.corner_radius} → ${layer_pair.after_layer.corner_radius} corner radius.`;
}
