// Read-only Figma capture, 2026-10-13. Geometry belongs to this reference artwork.
const BUTTON_OVERVIEW_REFERENCE = {
  file_key: 'UMshUcV87SZqsg1aDaDpnZ',
  wrapper_node_id: '1884:2415',
  component_node_id: '1394:1177',
  source_node_ids: ['1884:2415', '1394:1177', '1196:889', '1394:1189', '1884:2413', '1884:2409', '1884:2411', '1394:1191', '1881:2405', '1881:2403', '1881:2407'],
  reference_width: 559,
  reference_height: 202,
  preview_path: '/button-variants-overview.png',
  captured_on: '2026-10-13',
};

export function figma_overview_reference(component_id, reference_url) {
  if (component_id !== 'atoms-button') return null;
  try {
    const parsed_url = new URL(reference_url);
    const node_id = (parsed_url.searchParams.get('node-id') ?? '').replace('-', ':');
    if (!['www.figma.com', 'figma.com'].includes(parsed_url.hostname) || !(parsed_url.pathname === `/design/${BUTTON_OVERVIEW_REFERENCE.file_key}` || parsed_url.pathname.startsWith(`/design/${BUTTON_OVERVIEW_REFERENCE.file_key}/`)) || !BUTTON_OVERVIEW_REFERENCE.source_node_ids.includes(node_id)) return null;
    parsed_url.searchParams.set('node-id', BUTTON_OVERVIEW_REFERENCE.wrapper_node_id.replace(':', '-'));
    return { ...BUTTON_OVERVIEW_REFERENCE, wrapper_url: parsed_url.href };
  } catch { return null; }
}
