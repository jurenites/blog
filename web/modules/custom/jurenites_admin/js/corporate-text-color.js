/* CKEditor API method names follow the upstream contract. */
(function (ckeditor_api) {
  const { Plugin: EditorPlugin, Command: EditorCommand } = ckeditor_api.core;
  const { createDropdown: create_dropdown, addListToDropdown: add_list_to_dropdown, ViewModel } = ckeditor_api.ui;
  const { Collection: ViewCollection } = ckeditor_api.utils;
  const COLOR_OPTIONS = [
    ['full-black', 'Full black'],
    ['dark-black', 'Dark black'],
    ['black', 'Black'],
    ['light-black', 'Light black'],
    ['deep-gray', 'Deep gray'],
    ['dark-gray', 'Dark gray'],
    ['gray', 'Gray'],
    ['light-gray', 'Light gray'],
    ['pale-gray', 'Pale gray'],
    ['dark-white', 'Dark white'],
    ['light-white', 'Light white'],
    ['white', 'White'],
    ['full-white', 'Full white'],

    ['brand-primary', 'Primary'],
    ['brand-primary-accent', 'Primary accent'],
    ['brand-primary-soft', 'Primary soft'],
    ['brand-secondary', 'Secondary'],
    ['brand-secondary-accent', 'Secondary accent'],
    ['brand-secondary-soft', 'Secondary soft'],
    ['brand-tertiary', 'Tertiary'],
    ['brand-tertiary-accent', 'Tertiary accent'],
    ['brand-tertiary-soft', 'Tertiary soft'],
  ];

  class CorporateColorCommand extends EditorCommand {
    refresh() {
      const current_selection = this.editor.model.document.selection;
      this.value = current_selection.getAttribute('corporate_color');
      this.isEnabled = this.editor.model.schema.checkAttributeInSelection(current_selection, 'corporate_color');
    }

    execute({ color_name }) {
      if (color_name && !COLOR_OPTIONS.some(([option_name]) => option_name === color_name)) return;
      const editor_model = this.editor.model;
      const current_selection = editor_model.document.selection;
      editor_model.change((model_writer) => {
        if (current_selection.isCollapsed) {
          if (color_name) model_writer.setSelectionAttribute('corporate_color', color_name);
          else model_writer.removeSelectionAttribute('corporate_color');
        } else {
          for (const selected_range of editor_model.schema.getValidRanges(current_selection.getRanges(), 'corporate_color')) {
            if (color_name) model_writer.setAttribute('corporate_color', color_name, selected_range);
            else model_writer.removeAttribute('corporate_color', selected_range);
          }
        }
      });
    }
  }

  class CorporateTextColor extends EditorPlugin {
    static get pluginName() { return 'CorporateTextColor'; }

    init() {
      const editor_instance = this.editor;
      editor_instance.model.schema.extend('$text', { allowAttributes: 'corporate_color' });
      editor_instance.model.schema.setAttributeProperties('corporate_color', { isFormatting: true, copyOnEnter: true });
      for (const [color_name] of COLOR_OPTIONS) {
        editor_instance.conversion.for('upcast').elementToAttribute({
          view: { name: 'span', classes: `u-text-${color_name}` },
          model: { key: 'corporate_color', value: color_name },
        });
      }
      editor_instance.conversion.for('downcast').attributeToElement({
        model: 'corporate_color',
        view: (color_name, { writer: view_writer }) => view_writer.createAttributeElement('span', { class: `u-text-${color_name}` }),
      });
      const color_command = new CorporateColorCommand(editor_instance);
      editor_instance.commands.add('corporateTextColor', color_command);
      editor_instance.ui.componentFactory.add('corporateTextColor', (editor_locale) => {
        const dropdown_view = create_dropdown(editor_locale);
        dropdown_view.extendTemplate({ attributes: { class: 'corporate-text-color' } });
        dropdown_view.buttonView.set({ label: editor_instance.t('Text color'), withText: true, tooltip: true });
        dropdown_view.bind('isEnabled').to(color_command, 'isEnabled');
        const color_items = new ViewCollection();
        for (const [color_name, color_label] of [['', 'Default'], ...COLOR_OPTIONS]) {
          const button_model = new ViewModel({
            label: editor_instance.t(color_label), withText: true,
            class: `corporate-text-color__option corporate-text-color__option--${color_name || 'default'}`,
            color_name, role: 'menuitemradio',
          });
          button_model.bind('isOn').to(color_command, 'value', (selected_color) => (selected_color || '') === color_name);
          color_items.add({ type: 'button', model: button_model });
        }
        add_list_to_dropdown(dropdown_view, color_items, { role: 'menu' });
        this.listenTo(dropdown_view, 'execute', (click_event) => {
          editor_instance.execute('corporateTextColor', { color_name: click_event.source.color_name });
          editor_instance.editing.view.focus();
        });
        return dropdown_view;
      });
    }
  }
  ckeditor_api.corporateTextColor = { CorporateTextColor };
})(window.CKEditor5);
