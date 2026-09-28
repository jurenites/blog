/* Keep CKEditor’s native textarea, selection, and source/data synchronization. */
(function (ckeditor_api) {
  const { Plugin: EditorPlugin } = ckeditor_api.core;
  const { formatHtml: format_html } = ckeditor_api.utils;

  function highlight_source(source_text, highlight_layer) {
    const source_document = highlight_layer.ownerDocument;
    const output_fragment = source_document.createDocumentFragment();
    const token_pattern = /<!--[\s\S]*?(?:-->|$)|<\/?[a-zA-Z](?:[^<>"']|"[^"]*"|'[^']*')*>?|<![^>]*>?|&(?:#\d+|#x[\da-f]+|[a-z][\w]+);/gi;
    let last_offset = 0;
    function append_token(token_text, token_kind, target_node = output_fragment) {
      const token_span = source_document.createElement('span');
      token_span.className = `source-code__${token_kind}`;
      token_span.textContent = token_text;
      target_node.append(token_span);
    }
    for (const token_match of source_text.matchAll(token_pattern)) {
      output_fragment.append(source_text.slice(last_offset, token_match.index));
      const token_text = token_match[0];
      if (token_text.startsWith('<!--')) append_token(token_text, 'comment');
      else if (token_text.startsWith('&')) append_token(token_text, 'entity');
      else {
        const tag_fragment = source_document.createDocumentFragment();
        const tag_parts = token_text.match(/^(<\/?[\w:-]+|<![^\s>]+)([\s\S]*)$/);
        if (tag_parts) {
          append_token(tag_parts[1], 'tag', tag_fragment);
          const attribute_parts = tag_parts[2].split(/("[^"]*"|'[^']*'|[^\s=/>]+(?=\s*=)|\/?>)/g);
          for (const part_text of attribute_parts) {
            if (/^["']/.test(part_text)) append_token(part_text, 'value', tag_fragment);
            else if (/^\/?>$/.test(part_text)) append_token(part_text, 'tag', tag_fragment);
            else if (/^[^\s=/>]+$/.test(part_text)) append_token(part_text, 'attribute', tag_fragment);
            else tag_fragment.append(part_text);
          }
          output_fragment.append(tag_fragment);
        } else output_fragment.append(token_text);
      }
      last_offset = token_match.index + token_text.length;
    }
    output_fragment.append(source_text.slice(last_offset), '\n');
    highlight_layer.replaceChildren(output_fragment);
  }

  class SourceCode extends EditorPlugin {
    static get pluginName() { return 'SourceCode'; }

    afterInit() {
      const editor_instance = this.editor;
      if (!editor_instance.plugins.has('SourceEditing')) return;
      const source_plugin = editor_instance.plugins.get('SourceEditing');
      this.listenTo(editor_instance, 'change:isReadOnly', () => {
        for (const root_name of editor_instance.model.document.getRootNames()) {
          const source_area = editor_instance.ui.getEditableElement(`sourceEditing:${root_name}`);
          const format_button = source_area?.parentElement.querySelector('.source-code__format');
          if (format_button) format_button.disabled = editor_instance.isReadOnly;
        }
      });
      this.listenTo(source_plugin, 'change:isSourceEditingMode', () => {
        if (!source_plugin.isSourceEditingMode) return;
        for (const root_name of editor_instance.model.document.getRootNames()) {
          const source_area = editor_instance.ui.getEditableElement(`sourceEditing:${root_name}`);
          if (!source_area || source_area.parentElement.classList.contains('source-code')) continue;
          const source_wrapper = source_area.parentElement;
          const source_document = source_area.ownerDocument;
          const highlight_layer = source_document.createElement('pre');
          highlight_layer.className = 'source-code__highlight';
          highlight_layer.setAttribute('aria-hidden', 'true');
          source_area.spellcheck = false;
          source_wrapper.classList.add('source-code');
          source_wrapper.append(highlight_layer);
          const format_button = source_document.createElement('button');
          format_button.type = 'button';
          format_button.className = 'source-code__format';
          format_button.textContent = editor_instance.t('Format HTML');
          source_wrapper.append(format_button);
          const update_highlight = () => highlight_source(source_area.value, highlight_layer);
          const format_source = () => {
            if (source_area.readOnly || !source_area.isConnected) return;
            // The upstream formatter treats angle brackets in quoted attributes
            // as tag boundaries. Shield those values during explicit formatting.
            const quoted_values = [];
            const marker_prefix = `sourcevalue${Date.now()}x`;
            const protected_text = source_area.value.replace(/<\/?[a-zA-Z](?:[^<>"']|"[^"]*"|'[^']*')*>/g, (tag_text) =>
              tag_text.replace(/"[^"]*"|'[^']*'/g, (quoted_text) => {
                quoted_values.push(quoted_text);
                return `"${marker_prefix}${quoted_values.length - 1}"`;
              }));
            const formatted_text = format_html(protected_text).replace(
              new RegExp(`"${marker_prefix}(\\d+)"`, 'g'),
              (_match_text, value_index) => quoted_values[Number(value_index)],
            );
            if (formatted_text !== source_area.value) {
              source_area.setRangeText(formatted_text, 0, source_area.value.length, 'start');
              source_area.dispatchEvent(new Event('input', { bubbles: true }));
            }
            update_highlight();
          };
          format_button.disabled = source_area.readOnly;
          format_button.addEventListener('click', () => { format_source(); source_area.focus(); });
          source_area.addEventListener('input', (input_event) => {
            if (input_event.inputType === 'insertFromPaste') format_source();
            else update_highlight();
          });
          update_highlight();
        }
      }, { priority: 'low' });
    }
  }
  ckeditor_api.sourceCode = { SourceCode };
})(window.CKEditor5);
