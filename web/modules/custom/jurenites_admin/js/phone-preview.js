/* Preserve phone artwork and media nesting through the editor data pipeline. */
(function (ckeditor_api) {
  const { Plugin: EditorPlugin } = ckeditor_api.core;
  const { Widget: EditorWidget, toWidget: to_widget } = ckeditor_api.widget;

  class PhonePreview extends EditorPlugin {
    static get pluginName() { return 'PhonePreview'; }
    static get requires() { return [EditorWidget]; }

    init() {
      const editor_instance = this.editor;
      editor_instance.model.schema.register('phonePreview', {
        inheritAllFrom: '$blockObject',
        allowAttributes: ['preview_html', 'wrapper_marker', 'alignment'],
      });
      for (const wrapper_marker of ['data-phone-preview', 'data-scatchapp-sequence']) {
        const preview_matcher = { name: 'div', attributes: { [wrapper_marker]: true } };
        editor_instance.data.processor.registerRawContentMatcher(preview_matcher);
        editor_instance.conversion.for('upcast').elementToElement({
          view: preview_matcher,
          model: (view_element, { writer: model_writer }) => model_writer.createElement('phonePreview', {
            preview_html: view_element.getCustomProperty('$rawContent') || '',
            wrapper_marker,
          }),
          converterPriority: 'high',
        });
      }
      editor_instance.conversion.for('dataDowncast').elementToElement({
        model: 'phonePreview',
        view: (model_element, { writer: view_writer }) => view_writer.createRawElement('div', {
          [model_element.getAttribute('wrapper_marker')]: '',
        }, (dom_element) => {
          dom_element.innerHTML = model_element.getAttribute('preview_html');
        }),
      });
      editor_instance.conversion.for('editingDowncast').elementToElement({
        model: 'phonePreview',
        view: (_model_element, { writer: view_writer }) => {
          const preview_element = view_writer.createContainerElement('div', { class: 'phone-preview-editor' });
          view_writer.insert(view_writer.createPositionAt(preview_element, 0), view_writer.createText(
            editor_instance.t('Phone preview. Its videos and phone artwork are preserved when you save. Use Source to edit its HTML.'),
          ));
          return to_widget(preview_element, view_writer, { label: editor_instance.t('Phone preview') });
        },
      });
    }
  }
  ckeditor_api.phonePreview = { PhonePreview };
})(window.CKEditor5);
