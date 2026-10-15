const STORAGE_KEY = 'jurenites-comparison-preferences';

export function create_layout_preferences(storage_backend) {
  let visitor_preferences;
  try {
    storage_backend ??= globalThis.localStorage;
    visitor_preferences = JSON.parse(storage_backend?.getItem(STORAGE_KEY) ?? 'null');
  } catch { /* Keep layout controls usable when browser storage is unavailable. */ }
  if (!/^[a-f0-9]{32}$/.test(visitor_preferences?.visitor_id ?? '')) {
    const random_bytes = crypto.getRandomValues(new Uint8Array(16));
    visitor_preferences = { visitor_id: Array.from(random_bytes, byte_value => byte_value.toString(16).padStart(2, '0')).join('') };
  }
  visitor_preferences.comparison_layout = visitor_preferences.comparison_layout === 'list' ? 'list' : 'columns';
  function save_layout(comparison_layout) {
    if (!['columns', 'list'].includes(comparison_layout)) return;
    visitor_preferences.comparison_layout = comparison_layout;
    try { storage_backend?.setItem(STORAGE_KEY, JSON.stringify(visitor_preferences)); }
    catch { /* Retain the preference in memory for this visit. */ }
  }
  save_layout(visitor_preferences.comparison_layout);
  return {
    read_layout: () => visitor_preferences.comparison_layout,
    save_layout,
  };
}

export const browser_layout_preferences = create_layout_preferences();
