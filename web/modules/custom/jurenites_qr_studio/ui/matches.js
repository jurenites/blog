import {validate_text_layer} from './pixel-text.js?font=4pixel-5';
// Search history is independent of paint undo: undoing an edit does not forget a discovery.
export function validate_matches(match_rows = []) {
  if (!Array.isArray(match_rows) || match_rows.length > 1000) {
    throw new Error('A project can contain up to 1,000 saved matches.');
  }
  const seen_payloads = new Set();
  return match_rows.filter(match_info => {
    if (!match_info || typeof match_info.payload_text !== 'string' || !match_info.payload_text.length || match_info.payload_text.length > 4096 ||
        !Number.isInteger(match_info.version_number) || match_info.version_number < 1 || match_info.version_number > 10 ||
        !['L', 'M', 'Q', 'H'].includes(match_info.error_level) || !Number.isInteger(match_info.mask_index) || match_info.mask_index < 0 || match_info.mask_index > 7) {
      throw new Error('A saved match contains invalid QR settings.');
    }
    if(match_info.quarter_turns!==undefined&&![0,1,2,3].includes(match_info.quarter_turns))throw new Error('Invalid saved QR rotation.');
    const grid_size = 17 + 4 * match_info.version_number;
    if (!Array.isArray(match_info.lock_values) || match_info.lock_values.length !== grid_size * grid_size ||
        match_info.lock_values.some(cell_value => ![-1, 0, 1].includes(cell_value))) {
      throw new Error('A saved match contains an invalid lock grid.');
    }
    if (seen_payloads.has(match_info.payload_text)) return false;
    seen_payloads.add(match_info.payload_text);
    return true;
  }).map(match_info => ({
    text_layer:validate_text_layer(match_info.text_layer,17+4*match_info.version_number),
    payload_text: match_info.payload_text,
    version_number: match_info.version_number,
    error_level: match_info.error_level,
    mask_index: match_info.mask_index,
    alpha_only: match_info.alpha_only===true,
    is_active: match_info.is_active !== false,
    address_pattern:typeof match_info.address_pattern==='string'&&match_info.address_pattern.length<=4096?match_info.address_pattern:match_info.payload_text,
    quarter_turns: match_info.quarter_turns??0,
    lock_values: [...match_info.lock_values],
    protect_structure: match_info.protect_structure !== false,
  }));
}
export function append_match(match_rows, match_info) {
  if (match_rows.some(saved_match => saved_match.payload_text === match_info.payload_text)) return match_rows;
  return validate_matches([...match_rows, match_info]);
}
export function excluded_addresses(match_rows) {
  return [...new Set(match_rows.map(match_info => match_info.payload_text))];
}
