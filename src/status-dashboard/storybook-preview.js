import { combination_values } from './button-combinations.js';

export function button_preview_url(story_reference, combination_key, dashboard_origin) {
  const preview_url = new URL(story_reference, dashboard_origin);
  const story_path = preview_url.searchParams.get('path');
  if (story_path) {
    preview_url.pathname = preview_url.pathname.replace(/\/?$/, '/iframe.html');
    preview_url.searchParams.set('id', story_path.replace(/^\/(docs|story)\//, '').replace(/--docs$/, '--default-story'));
    preview_url.searchParams.delete('path');
  }
  const argument_values = Object.fromEntries((preview_url.searchParams.get('args') ?? '').split(';').filter(Boolean).map(argument_pair => {
    const separator_index = argument_pair.indexOf(':');
    return [argument_pair.slice(0, separator_index), argument_pair.slice(separator_index + 1)];
  }));
  const { button_style, is_disabled, pointer_state } = combination_values(combination_key);
  delete argument_values.style_variant;
  argument_values.button_style = button_style;
  argument_values.is_disabled = is_disabled;
  preview_url.searchParams.set('args', Object.entries(argument_values).map(([argument_name, argument_value]) => `${argument_name}:${argument_value}`).join(';'));
  preview_url.searchParams.set('viewMode', 'story');
  preview_url.searchParams.set('preview_state', pointer_state);
  preview_url.searchParams.set('component_preview', 'button');
  preview_url.searchParams.set('preview_parent', dashboard_origin);
  return preview_url.href;
}
