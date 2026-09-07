// Figma token and style sync helper.
// Source of truth: src/token/tokens.yaml via generated/token/tokens.js.
// Run as a bundled local Figma plugin module or through the Figma Plugin API.

import { TOKEN_RECORDS } from '../../generated/token/tokens.js';

const SYNC_SOURCE_PATH = 'src/token/tokens.yaml';
const SYNC_SCRIPT_PATH = 'scripts/figma/design-system-sync.js';
const MANAGED_DESCRIPTION_PREFIX = `Managed by ${SYNC_SCRIPT_PATH} from ${SYNC_SOURCE_PATH}.`;
const DEFAULT_MODE_NAME = 'Value';
const COLLECTION_NAMES = {
  system: 'System',
  color: 'Color',
  theme: 'Theme',
  typography: 'Typography',
  space: 'Space',
  shape: 'Shape',
  elevation: 'Elevation',
  motion: 'Motion',
  layout: 'Layout',
  component: 'Component',
};
const FONT_WEIGHT_STYLES = {
  100: ['Thin'],
  200: ['ExtraLight', 'Extra Light'],
  300: ['Light'],
  400: ['Regular'],
  500: ['Medium', 'SemiBold', 'Semi Bold'],
  600: ['SemiBold', 'Semi Bold', 'Bold'],
  700: ['Bold'],
  800: ['ExtraBold', 'Extra Bold', 'Bold'],
  900: ['Black', 'ExtraBold', 'Extra Bold'],
};
const MONOSPACE_FALLBACK_FAMILIES = ['Ubuntu Sans Mono', 'Roboto Mono', 'Inter'];
const SANS_FALLBACK_FAMILIES = ['Open Sans', 'Inter'];

function token_variable_name(token_record) {
  return token_record.path.join('/');
}

function token_style_name(token_record) {
  return token_record.path
    .map((path_part) => path_part
      .split('-')
      .map((word_part) => word_part.charAt(0).toUpperCase() + word_part.slice(1))
      .join(' '))
    .join('/');
}

function collection_name(token_record) {
  const root_name = token_record.path[0];
  return COLLECTION_NAMES[root_name] ?? root_name.charAt(0).toUpperCase() + root_name.slice(1);
}

function is_hex_color(token_value) {
  return typeof token_value === 'string' && /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(token_value.trim());
}

function is_pixel_dimension(token_value) {
  return typeof token_value === 'string' && /^-?[0-9]+(?:\.[0-9]+)?px;?$/.test(token_value.trim());
}

function is_shadow_value(token_value) {
  return typeof token_value === 'string'
    && /-?[0-9]+(?:\.[0-9]+)?px\s+-?[0-9]+(?:\.[0-9]+)?px\s+-?[0-9]+(?:\.[0-9]+)?px\s+-?[0-9]+(?:\.[0-9]+)?px\s+#[0-9a-f]{8}/i.test(token_value);
}

function is_typography_style(token_record) {
  return token_record.path[0] === 'typography'
    && token_record.path.length === 2
    && token_record.type === 'string'
    && /[0-9]+(?:\.[0-9]+)?px\s+var\(--typography-font-family-[^)]+\)/.test(token_record.css_value);
}

function variable_type(token_record) {
  const resolved_value = token_record.resolved_css_value;
  if (token_record.type === 'color' || is_hex_color(resolved_value)) return 'COLOR';
  if (['dimension', 'duration', 'number'].includes(token_record.type) || is_pixel_dimension(resolved_value)) return 'FLOAT';
  if (token_record.type === 'shadow' || is_shadow_value(resolved_value) || is_typography_style(token_record)) return null;
  return 'STRING';
}

function color_channels(hex_color) {
  const clean_color = hex_color.trim().replace('#', '');
  return {
    r: Number.parseInt(clean_color.slice(0, 2), 16) / 255,
    g: Number.parseInt(clean_color.slice(2, 4), 16) / 255,
    b: Number.parseInt(clean_color.slice(4, 6), 16) / 255,
    a: clean_color.length === 8 ? Number.parseInt(clean_color.slice(6, 8), 16) / 255 : 1,
  };
}

function numeric_token_value(token_record) {
  const numeric_value = Number.parseFloat(String(token_record.resolved_css_value).replace(';', ''));
  if (Number.isNaN(numeric_value)) throw new Error(`Invalid numeric token ${token_record.name}: ${token_record.resolved_css_value}`);
  return numeric_value;
}

function string_token_value(token_record) {
  if (token_record.type === 'fontFamily' && Array.isArray(token_record.value)) return token_record.value.join(', ');
  return String(token_record.resolved_css_value);
}

function raw_variable_value(token_record, resolved_type) {
  if (resolved_type === 'COLOR') return color_channels(token_record.resolved_css_value);
  if (resolved_type === 'FLOAT') return numeric_token_value(token_record);
  return string_token_value(token_record);
}

function variable_scopes(token_record, resolved_type) {
  const token_name = token_record.name;
  if (resolved_type === 'COLOR') {
    if (token_name.startsWith('color-palette-')) return [];
    if (/(^|-)text-|foreground/.test(token_name)) return ['TEXT_FILL'];
    if (/border|outline|divider/.test(token_name)) return ['STROKE_COLOR'];
    if (/surface|background/.test(token_name)) return ['FRAME_FILL', 'SHAPE_FILL'];
    return ['FRAME_FILL', 'SHAPE_FILL', 'TEXT_FILL', 'STROKE_COLOR'];
  }
  if (resolved_type === 'FLOAT') {
    if (/corner-radius/.test(token_name)) return ['CORNER_RADIUS'];
    if (/border-width/.test(token_name)) return ['STROKE_FLOAT'];
    if (/^space-|gap|gutter|padding/.test(token_name)) return ['GAP', 'WIDTH_HEIGHT'];
    if (/size|width|height|viewport|breakpoint|container|max|min|tile|marker|grid/.test(token_name)) return ['WIDTH_HEIGHT'];
    return [];
  }
  if (token_record.type === 'fontFamily') return ['FONT_FAMILY'];
  return [];
}

function managed_description(token_record) {
  const token_note = token_record.description ? ` ${token_record.description}` : '';
  return `${MANAGED_DESCRIPTION_PREFIX} Token: ${token_record.name}.${token_note}`;
}

function shadow_effects(shadow_value) {
  const shadow_pattern = /(-?[0-9]+(?:\.[0-9]+)?)px\s+(-?[0-9]+(?:\.[0-9]+)?)px\s+(-?[0-9]+(?:\.[0-9]+)?)px\s+(-?[0-9]+(?:\.[0-9]+)?)px\s+(#[0-9a-f]{8})/gi;
  const parsed_effects = [];
  for (const shadow_match of shadow_value.matchAll(shadow_pattern)) {
    parsed_effects.push({
      type: 'DROP_SHADOW',
      offset: { x: Number(shadow_match[1]), y: Number(shadow_match[2]) },
      radius: Number(shadow_match[3]),
      spread: Number(shadow_match[4]),
      color: color_channels(shadow_match[5]),
      visible: true,
      blendMode: 'NORMAL',
    });
  }
  if (parsed_effects.length === 0) throw new Error(`Invalid shadow token: ${shadow_value}`);
  return parsed_effects;
}

function typography_definition(token_record) {
  const typography_match = token_record.css_value.match(/^(?:(\d+)\s+)?([0-9]+(?:\.[0-9]+)?)px\s+var\(--(typography-font-family-[^)]+)\)$/);
  if (!typography_match) throw new Error(`Invalid typography token: ${token_record.name}`);
  const family_record = TOKEN_RECORDS.find((candidate_record) => candidate_record.name === typography_match[3]);
  if (!family_record || !Array.isArray(family_record.value)) throw new Error(`Missing font-family token for ${token_record.name}`);
  return {
    requested_family: String(family_record.value[0]),
    font_size: Number(typography_match[2]),
    font_weight: Number(typography_match[1] ?? 400),
  };
}

function preferred_font_styles(font_weight) {
  return FONT_WEIGHT_STYLES[font_weight] ?? FONT_WEIGHT_STYLES[400];
}

function available_font_name(typography_role, available_fonts) {
  const requested_family = typography_role.requested_family;
  const preferred_styles = preferred_font_styles(typography_role.font_weight);
  const is_monospace_role = /mono|courier|4pixel/i.test(requested_family);
  const candidate_families = [
    requested_family,
    ...(is_monospace_role ? MONOSPACE_FALLBACK_FAMILIES : SANS_FALLBACK_FAMILIES),
  ];
  for (const candidate_family of candidate_families) {
    for (const candidate_style of preferred_styles) {
      const matching_font = available_fonts.find((font_record) => font_record.fontName.family === candidate_family && font_record.fontName.style === candidate_style);
      if (matching_font) return matching_font.fontName;
    }
  }
  throw new Error(`No usable Figma font for ${requested_family} at weight ${typography_role.font_weight}.`);
}

async function sync_variable_collections(variable_records) {
  const existing_collections = await figma.variables.getLocalVariableCollectionsAsync();
  const required_names = [...new Set(variable_records.map((token_record) => collection_name(token_record)))];
  const collection_map = new Map();
  const mutated_collection_ids = [];
  for (const required_name of required_names) {
    let target_collection = existing_collections.find((collection_record) => collection_record.name === required_name);
    if (!target_collection) target_collection = figma.variables.createVariableCollection(required_name);
    const default_mode = target_collection.modes[0];
    if (default_mode.name !== DEFAULT_MODE_NAME) target_collection.renameMode(default_mode.modeId, DEFAULT_MODE_NAME);
    collection_map.set(required_name, target_collection);
    mutated_collection_ids.push(target_collection.id);
  }
  return { collection_map, mutated_collection_ids };
}

async function sync_variables(variable_records) {
  const { collection_map, mutated_collection_ids } = await sync_variable_collections(variable_records);
  const existing_variables = await figma.variables.getLocalVariablesAsync();
  const managed_variables = new Map(existing_variables
    .filter((variable_record) => variable_record.description.startsWith(MANAGED_DESCRIPTION_PREFIX))
    .map((variable_record) => [`${variable_record.variableCollectionId}:${variable_record.name}`, variable_record]));
  const synced_variables = new Map();
  const mutated_variable_ids = [];

  for (const token_record of variable_records) {
    const resolved_type = variable_type(token_record);
    const target_collection = collection_map.get(collection_name(token_record));
    const variable_name = token_variable_name(token_record);
    const variable_key = `${target_collection.id}:${variable_name}`;
    let target_variable = managed_variables.get(variable_key);
    if (target_variable && target_variable.resolvedType !== resolved_type) {
      target_variable.remove();
      target_variable = null;
    }
    if (!target_variable) target_variable = figma.variables.createVariable(variable_name, target_collection, resolved_type);
    target_variable.description = managed_description(token_record);
    target_variable.scopes = variable_scopes(token_record, resolved_type);
    target_variable.setVariableCodeSyntax('WEB', `var(--${token_record.name})`);
    synced_variables.set(token_record.name, target_variable);
    mutated_variable_ids.push(target_variable.id);
  }

  for (const token_record of variable_records) {
    const target_variable = synced_variables.get(token_record.name);
    const target_collection = collection_map.get(collection_name(token_record));
    const target_mode_id = target_collection.modes[0].modeId;
    const reference_variable = token_record.reference_name ? synced_variables.get(token_record.reference_name) : null;
    if (reference_variable && reference_variable.resolvedType === target_variable.resolvedType) {
      target_variable.setValueForMode(target_mode_id, figma.variables.createVariableAlias(reference_variable));
    } else {
      target_variable.setValueForMode(target_mode_id, raw_variable_value(token_record, target_variable.resolvedType));
    }
  }

  const required_keys = new Set(variable_records.map((token_record) => {
    const target_collection = collection_map.get(collection_name(token_record));
    return `${target_collection.id}:${token_variable_name(token_record)}`;
  }));
  const removed_variable_ids = [];
  for (const [variable_key, managed_variable] of managed_variables) {
    if (!required_keys.has(variable_key)) {
      removed_variable_ids.push(managed_variable.id);
      managed_variable.remove();
    }
  }

  return { synced_variables, mutated_collection_ids, mutated_variable_ids, removed_variable_ids };
}

async function sync_text_styles(typography_records) {
  const available_fonts = await figma.listAvailableFontsAsync();
  const existing_styles = await figma.getLocalTextStylesAsync();
  const managed_styles = new Map(existing_styles
    .filter((style_record) => style_record.description.startsWith(MANAGED_DESCRIPTION_PREFIX))
    .map((style_record) => [style_record.name, style_record]));
  const required_names = new Set();
  const mutated_style_ids = [];
  const font_fallbacks = [];

  for (const token_record of typography_records) {
    const style_name = token_style_name(token_record);
    const typography_role = typography_definition(token_record);
    const font_name = available_font_name(typography_role, available_fonts);
    await figma.loadFontAsync(font_name);
    let text_style = managed_styles.get(style_name);
    if (!text_style) text_style = figma.createTextStyle();
    text_style.name = style_name;
    text_style.fontName = font_name;
    text_style.fontSize = typography_role.font_size;
    text_style.lineHeight = { unit: 'AUTO' };
    text_style.letterSpacing = { value: 0, unit: 'PIXELS' };
    text_style.description = managed_description(token_record);
    required_names.add(style_name);
    mutated_style_ids.push(text_style.id);
    if (font_name.family !== typography_role.requested_family) {
      font_fallbacks.push({ style_name, requested_family: typography_role.requested_family, applied_family: font_name.family });
    }
  }

  const removed_style_ids = [];
  for (const [style_name, managed_style] of managed_styles) {
    if (!required_names.has(style_name)) {
      removed_style_ids.push(managed_style.id);
      managed_style.remove();
    }
  }
  return { mutated_style_ids, removed_style_ids, font_fallbacks };
}

async function sync_effect_styles(shadow_records) {
  const existing_styles = await figma.getLocalEffectStylesAsync();
  const managed_styles = new Map(existing_styles
    .filter((style_record) => style_record.description.startsWith(MANAGED_DESCRIPTION_PREFIX))
    .map((style_record) => [style_record.name, style_record]));
  const required_names = new Set();
  const mutated_style_ids = [];

  for (const token_record of shadow_records) {
    const style_name = token_style_name(token_record);
    let effect_style = managed_styles.get(style_name);
    if (!effect_style) effect_style = figma.createEffectStyle();
    effect_style.name = style_name;
    effect_style.effects = shadow_effects(token_record.resolved_css_value);
    effect_style.description = managed_description(token_record);
    required_names.add(style_name);
    mutated_style_ids.push(effect_style.id);
  }

  const removed_style_ids = [];
  for (const [style_name, managed_style] of managed_styles) {
    if (!required_names.has(style_name)) {
      removed_style_ids.push(managed_style.id);
      managed_style.remove();
    }
  }
  return { mutated_style_ids, removed_style_ids };
}

export async function run_design_system_sync() {
  const typography_records = TOKEN_RECORDS.filter((token_record) => is_typography_style(token_record));
  const shadow_records = TOKEN_RECORDS.filter((token_record) => token_record.type === 'shadow' || is_shadow_value(token_record.resolved_css_value));
  const variable_records = TOKEN_RECORDS.filter((token_record) => variable_type(token_record));

  const variable_result = await sync_variables(variable_records);
  const text_style_result = await sync_text_styles(typography_records);
  const effect_style_result = await sync_effect_styles(shadow_records);

  return {
    source: SYNC_SOURCE_PATH,
    collections: variable_result.mutated_collection_ids,
    variables: variable_result.mutated_variable_ids,
    removed_variables: variable_result.removed_variable_ids,
    text_styles: text_style_result.mutated_style_ids,
    removed_text_styles: text_style_result.removed_style_ids,
    effect_styles: effect_style_result.mutated_style_ids,
    removed_effect_styles: effect_style_result.removed_style_ids,
    counts: {
      collections: variable_result.mutated_collection_ids.length,
      variables: variable_result.mutated_variable_ids.length,
      text_styles: text_style_result.mutated_style_ids.length,
      effect_styles: effect_style_result.mutated_style_ids.length,
    },
    font_fallbacks: text_style_result.font_fallbacks,
  };
}
