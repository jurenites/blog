// Text values and content-driven width are evidence, never style failures.
export function read_component_appearance(component_element) {
  const surface_keys = ['backgroundColor', 'minHeight', 'minWidth', 'columnGap', 'rowGap', 'alignItems', 'justifyContent', 'boxSizing', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor', 'borderTopStyle', 'borderRightStyle', 'borderBottomStyle', 'borderLeftStyle', 'borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomLeftRadius', 'borderBottomRightRadius', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'boxShadow', 'outlineStyle', 'outlineWidth', 'outlineColor', 'outlineOffset'];
  const text_keys = ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing', 'textTransform', 'color', 'textDecorationLine'];
  function style_values(target_element, property_keys) {
    const element_style = getComputedStyle(target_element);
    return Object.fromEntries(property_keys.map((property_key) => [property_key, property_key === 'fontFamily' ? element_style[property_key].split(',')[0].replace(/["']/g, '').trim().toLowerCase() : element_style[property_key]]));
  }
  const text_elements = [component_element, ...component_element.querySelectorAll('*')].filter((child_element) => [...child_element.childNodes].some((child_node) => child_node.nodeType === Node.TEXT_NODE && child_node.textContent.trim()) && child_element.getClientRects().length && getComputedStyle(child_element).visibility !== 'hidden' && getComputedStyle(child_element).opacity !== '0' && !child_element.closest('[hidden]'));
  if (component_element.matches('input[type=submit],input[type=button]')) text_elements.unshift(component_element);
  const element_bounds = component_element.getBoundingClientRect();
  const interactive_element = component_element.matches('a[href],button,input,select,textarea,[tabindex]') ? component_element : component_element.querySelector('a[href],button,input,select,textarea,[tabindex]');
  return {
    surface_styles: style_values(component_element, surface_keys),
    text_styles: text_elements.slice(0, 24).map((text_element) => style_values(text_element, text_keys)).filter((style_row, style_index, style_rows) => style_index === 0 || JSON.stringify(style_row) !== JSON.stringify(style_rows[style_index - 1])),
    text_content: component_element.matches('input') ? component_element.value : component_element.innerText ?? '',
    image_sources: [...component_element.querySelectorAll('img')].map((image_element) => image_element.currentSrc),
    component_bounds: { width: element_bounds.width, height: element_bounds.height },
    content_overflow: component_element.scrollWidth > component_element.clientWidth + 1 && getComputedStyle(component_element).overflowX === 'hidden',
    interactive_state: interactive_element ? { hovered: interactive_element.matches(':hover'), focused: interactive_element.matches(':focus'), focus_visible: interactive_element.matches(':focus-visible'), active: interactive_element.matches(':active'), disabled: interactive_element.matches(':disabled'), checked: interactive_element.matches(':checked') } : null,
  };
}

function values_match(expected_value, actual_value) {
  if (expected_value === actual_value) return true;
  if (typeof expected_value === 'number') return Math.abs(expected_value - parseFloat(actual_value)) <= 0.1;
  if (expected_value === '0px' && actual_value === 'normal') return true;
  return false;
}

export function compare_appearance(reference_data, actual_data) {
  const differences_list = [];
  let compared_count = 0;
  function compare_fields(expected_styles, actual_styles, role_name) {
    for (const [property_key, expected_value] of Object.entries(expected_styles)) {
      // Automatic versus zero minimums come from surrounding flex/grid context; neither declares an explicit component minimum.
      if (['minHeight', 'minWidth'].includes(property_key) && ['auto', '0px'].includes(expected_value) && ['auto', '0px'].includes(actual_styles[property_key])) continue;
      // Browsers retain irrelevant border/outline colors even when no line is drawn.
      if (/^border.*(Color|Style)$/.test(property_key) && parseFloat(expected_styles[property_key.replace(/Color|Style/, 'Width')]) === 0 && parseFloat(actual_styles[property_key.replace(/Color|Style/, 'Width')]) === 0) continue;
      if (property_key.startsWith('outline') && expected_styles.outlineStyle === 'none' && actual_styles.outlineStyle === 'none') continue;
      compared_count += 1;
      if (!values_match(expected_value, actual_styles[property_key])) differences_list.push({ role_name, property_key, expected_value, actual_value: actual_styles[property_key] ?? 'missing' });
    }
  }
  compare_fields(reference_data.surface_styles ?? {}, actual_data.surface_styles ?? {}, 'surface');
  for (const [text_index, expected_styles] of (reference_data.text_styles ?? []).entries()) compare_fields(expected_styles, actual_data.text_styles?.[text_index] ?? {}, `text ${text_index + 1}`);
  if (!reference_data.allow_extra_text_roles && reference_data.text_styles?.length && reference_data.text_styles.length !== actual_data.text_styles?.length) differences_list.push({ role_name: 'text structure', property_key: 'styled text roles', expected_value: reference_data.text_styles.length, actual_value: actual_data.text_styles?.length ?? 0 });
  if (actual_data.content_overflow) differences_list.push({ role_name: 'layout', property_key: 'content clipping', expected_value: false, actual_value: true });
  return { status: !compared_count ? 'blocked' : differences_list.length ? 'failed' : 'passed', message: !compared_count ? 'No comparable appearance properties.' : differences_list.length ? `${differences_list.length} appearance differences. Text values and content-driven width are excluded.` : `${compared_count} appearance properties match. Text values and content-driven width are excluded.`, compared_count, differences_list, content_differs: reference_data.text_content !== actual_data.text_content, reference_text: reference_data.text_content, actual_text: actual_data.text_content, reference_bounds: reference_data.component_bounds, actual_bounds: actual_data.component_bounds };
}

export function figma_appearance(node_data) {
  function paint_color(paint_rows) {
    const solid_paint = Array.isArray(paint_rows) && paint_rows.find((paint_row) => paint_row.type === 'SOLID' && paint_row.visible !== false && paint_row.opacity === 1);
    return solid_paint ? `rgb(${['r', 'g', 'b'].map((channel_name) => Math.round(solid_paint.color[channel_name] * 255)).join(', ')})` : undefined;
  }
  const surface_styles = {};
  const background_color = paint_color(node_data.fills);
  if (background_color) surface_styles.backgroundColor = background_color;
  if (node_data.corner_radius === 0) for (const corner_name of ['TopLeft', 'TopRight', 'BottomLeft', 'BottomRight']) surface_styles[`border${corner_name}Radius`] = '0px';
  // Compare explicit visual attributes, not Figma auto-layout implementation details.
  const text_styles = (node_data.text_styles ?? []).map((text_row) => {
    const style_values = { fontFamily: text_row.font.family.toLowerCase(), fontSize: text_row.font_size, fontWeight: String(text_row.font.variationSettings?.wght ?? (/Light/.test(text_row.font.style) ? 300 : /Bold/.test(text_row.font.style) ? 700 : 400)) };
    const foreground_color = paint_color(text_row.fills);
    if (foreground_color) style_values.color = foreground_color;
    if (text_row.line_height?.unit === 'PIXELS') style_values.lineHeight = text_row.line_height.value;
    if (text_row.letter_spacing?.unit === 'PIXELS') style_values.letterSpacing = `${text_row.letter_spacing.value}px`;
    if (text_row.text_case === 'UPPER') style_values.textTransform = 'uppercase';
    return style_values;
  });
  return { surface_styles, text_styles: text_styles.filter((style_row, style_index) => style_index === 0 || JSON.stringify(style_row) !== JSON.stringify(text_styles[style_index - 1])), allow_extra_text_roles: true, text_content: (node_data.text_styles ?? []).map((text_row) => text_row.text).join(' '), component_bounds: { width: node_data.width, height: node_data.height } };
}
