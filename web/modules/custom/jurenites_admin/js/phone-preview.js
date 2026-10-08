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
        allowAttributes: ['preview_html', 'wrapper_attributes', 'wrapper_name', 'alignment'],
      });
      const preview_matchers = [
        { name: 'div', attributes: { 'data-phone-preview': true } },
        { name: 'div', attributes: { 'data-scatchapp-sequence': true } },
        { name: 'div', classes: 'accountia-preview__phones' },
        { name: 'div', attributes: { 'data-accountia-gallery': true } },
        { name: 'div', attributes: { 'data-accountia-video': true } },
        // Home slides embed cards directly, without a dedicated preview wrapper.
        { name: 'a', attributes: { 'data-cursor-card': true } },
        { name: 'div', attributes: { 'data-cursor-card': true } },
      ];
      for (const preview_matcher of preview_matchers) {
        editor_instance.data.processor.registerRawContentMatcher(preview_matcher);
        editor_instance.conversion.for('upcast').elementToElement({
          view: preview_matcher,
          model: (view_element, { writer: model_writer }) => model_writer.createElement('phonePreview', {
            preview_html: view_element.getCustomProperty('$rawContent') || '',
            wrapper_attributes: JSON.stringify(Object.fromEntries(view_element.getAttributes())),
            wrapper_name: view_element.name,
          }),
          converterPriority: 'high',
        });
      }
      editor_instance.conversion.for('dataDowncast').elementToElement({
        model: 'phonePreview',
        view: (model_element, { writer: view_writer }) => view_writer.createRawElement(model_element.getAttribute('wrapper_name') || 'div',
          JSON.parse(model_element.getAttribute('wrapper_attributes')), (dom_element) => {
          dom_element.innerHTML = model_element.getAttribute('preview_html');
        }),
      });
      editor_instance.conversion.for('editingDowncast').elementToElement({
        model: 'phonePreview',
        view: (_model_element, { writer: view_writer }) => {
          const preview_element = view_writer.createContainerElement('div', { class: 'phone-preview-editor' });
          view_writer.insert(view_writer.createPositionAt(preview_element, 0), view_writer.createText(
            editor_instance.t('Interactive preview. Its artwork, media and controls are preserved when you save. Use Source to edit its HTML.'),
          ));
          return to_widget(preview_element, view_writer, { label: editor_instance.t('Interactive preview') });
        },
      });
    }
  }
  ckeditor_api.phonePreview = { PhonePreview };
})(window.CKEditor5);
