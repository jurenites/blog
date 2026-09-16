/* CKEditor API method names follow the upstream contract. */
(function (ckeditor_api) {
  const { Plugin: EditorPlugin, Command: EditorCommand } = ckeditor_api.core;
  const { ButtonView: EditorButton } = ckeditor_api.ui;
  const { Widget: EditorWidget, toWidget: make_widget, toWidgetEditable: make_editable } = ckeditor_api.widget;

  function selected_term(editor_instance) {
    const current_selection = editor_instance.model.document.selection;
    const selected_element = current_selection.getSelectedElement();
    if (selected_element?.name === 'expandable_term') return selected_element;
    return current_selection.getFirstPosition()?.getAncestors().reverse()
      .find((ancestor_element) => ancestor_element.name === 'expandable_term');
  }

  class InsertExpandableTerm extends EditorCommand {
    refresh() {
      const current_selection = this.editor.model.document.selection;
      const selected_range = current_selection.getFirstRange();
      this.isEnabled = Boolean(selected_range && selected_range.start.parent === selected_range.end.parent
        && this.editor.model.schema.checkChild(selected_range.start, 'expandable_term')
        && ![...selected_range.getItems()].some((range_item) => !range_item.is('$textProxy') || range_item.hasAttribute('linkHref')));
    }

    execute() {
      const editor_instance = this.editor;
      const current_selection = editor_instance.model.document.selection;
      const selected_text = [...current_selection.getFirstRange().getItems()]
        .map((range_item) => range_item.data || '').join('');
      editor_instance.model.change((model_writer) => {
        const term_element = model_writer.createElement('expandable_term');
        const label_element = model_writer.createElement('expandable_label');
        const explanation_element = model_writer.createElement('expandable_explanation');
        model_writer.append(label_element, term_element);
        model_writer.append(explanation_element, term_element);
        model_writer.insertText(selected_text || editor_instance.t('Term'), label_element);
        model_writer.insertText(editor_instance.t('Write the expanded text here.'), explanation_element);
        editor_instance.model.insertContent(term_element);
        model_writer.setSelection(explanation_element, 'in');
      });
    }
  }

  class RemoveExpandableTerm extends EditorCommand {
    refresh() { this.isEnabled = Boolean(selected_term(this.editor)); }
    execute() {
      const editor_instance = this.editor;
      const term_element = selected_term(editor_instance);
      if (!term_element) return;
      editor_instance.model.change((model_writer) => {
        const label_element = term_element.getChild(0);
        const label_text = [...label_element.getChildren()].map((text_item) => text_item.data || '').join('');
        const term_position = model_writer.createPositionBefore(term_element);
        model_writer.remove(term_element);
        model_writer.insertText(label_text, term_position);
        model_writer.setSelection(term_position.getShiftedBy(label_text.length));
      });
    }
  }

  class ExpandingText extends EditorPlugin {
    static get requires() { return [EditorWidget]; }
    static get pluginName() { return 'ExpandingText'; }
    init() {
      const editor_instance = this.editor;
      const model_schema = editor_instance.model.schema;
      model_schema.register('expandable_term', {
        inheritAllFrom: '$inlineObject', allowChildren: ['expandable_label', 'expandable_explanation'],
      });
      model_schema.register('expandable_label', {
        isLimit: true, allowIn: 'expandable_term', allowChildren: '$text',
      });
      model_schema.register('expandable_explanation', {
        isLimit: true, allowIn: 'expandable_term', allowContentOf: '$block',
      });
      model_schema.addChildCheck((schema_context, child_definition) => {
        if (schema_context.endsWith('expandable_label') && child_definition.name !== '$text') return false;
        if (child_definition.name === 'expandable_term'
          && schema_context.last?.name === '$text') return false;
      });
      for (const [model_name, class_name] of [
        ['expandable_term', 'expandable-term'],
        ['expandable_label', 'expandable-term__label'],
        ['expandable_explanation', 'expandable-term__explanation'],
      ]) {
        editor_instance.conversion.for('upcast').elementToElement({
          view: { name: 'span', classes: class_name }, model: model_name, converterPriority: 'high',
        });
        editor_instance.conversion.for('dataDowncast').elementToElement({
          model: model_name, view: { name: 'span', classes: class_name },
        });
        editor_instance.conversion.for('editingDowncast').elementToElement({
          model: model_name,
          view: (model_element, { writer: view_writer }) => {
            if (model_name === 'expandable_term') {
              return make_widget(view_writer.createContainerElement('span', { class: class_name }), view_writer,
                { label: editor_instance.t('Expandable term') });
            }
            return make_editable(view_writer.createEditableElement('span', { class: class_name }), view_writer,
              { label: editor_instance.t(model_name === 'expandable_label' ? 'Short term' : 'Expanded text') });
          },
        });
      }
      editor_instance.commands.add('expandableTerm', new InsertExpandableTerm(editor_instance));
      editor_instance.commands.add('removeExpandableTerm', new RemoveExpandableTerm(editor_instance));
      for (const [command_name, button_label] of [
        ['expandableTerm', 'Expandable term'], ['removeExpandableTerm', 'Remove expansion'],
      ]) {
        editor_instance.ui.componentFactory.add(command_name, (editor_locale) => {
          const toolbar_button = new EditorButton(editor_locale);
          toolbar_button.set({ label: editor_instance.t(button_label), withText: true, tooltip: true });
          toolbar_button.bind('isEnabled').to(editor_instance.commands.get(command_name), 'isEnabled');
          this.listenTo(toolbar_button, 'execute', () => {
            editor_instance.execute(command_name);
            editor_instance.editing.view.focus();
          });
          return toolbar_button;
        });
      }
    }
  }
  ckeditor_api.expandingText = { ExpandingText };
})(window.CKEditor5);
