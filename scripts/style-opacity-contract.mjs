import scss_syntax from 'postcss-scss';

/** Color transparency belongs in tokens; binary keyframes control visibility. */
export function find_disallowed_opacity(source_content) {
  const syntax_tree = scss_syntax.parse(source_content);
  const invalid_declarations = [];
  syntax_tree.walkDecls(/(?:^|-)opacity$/i, (style_declaration) => {
    const keyframes_rule = style_declaration.parent?.parent;
    const is_keyframe = keyframes_rule?.type === 'atrule'
      && /^(?:-[a-z]+-)?keyframes$/i.test(keyframes_rule.name);
    const is_visibility_endpoint = style_declaration.prop.toLowerCase() === 'opacity'
      && /^(?:0|1)$/.test(style_declaration.value.trim());
    if (!is_keyframe || !is_visibility_endpoint) {
      invalid_declarations.push(style_declaration.source.start.line);
    }
  });
  return invalid_declarations;
}
