function accepts_file(selected_file, accepted_types) {
  const accepted_rules = accepted_types.toLowerCase().split(',').map((type_rule) => type_rule.trim()).filter(Boolean);
  return !accepted_rules.length || accepted_rules.some((type_rule) => {
    if (type_rule.startsWith('.')) return selected_file.name.toLowerCase().endsWith(type_rule);
    if (type_rule.endsWith('/*')) return selected_file.type.toLowerCase().startsWith(type_rule.slice(0, -1));
    return selected_file.type.toLowerCase() === type_rule;
  });
}

export function initialize_file_inputs(input_context) {
  for (const file_control of input_context.querySelectorAll('[data-file-input]')) {
    if (file_control.classList.contains('file-input--enhanced')) continue;
    const native_input = file_control.querySelector('.file-input__native');
    const choose_button = file_control.querySelector('.file-input__choose');
    const drop_zone = file_control.querySelector('.file-input__drop-zone');
    const filename_text = file_control.querySelector('.file-input__filename');
    const error_message = file_control.querySelector('.file-input__error');
    let drag_depth = 0;

    function show_error(error_text = '') {
      error_message.textContent = error_text;
      error_message.hidden = !error_text;
      native_input.setCustomValidity(error_text);
      native_input.setAttribute('aria-invalid', String(Boolean(error_text)));
      choose_button.setAttribute('aria-invalid', String(Boolean(error_text)));
    }
    function synchronize_file() {
      const selected_file = native_input.files[0];
      filename_text.textContent = selected_file?.name ?? drop_zone.dataset.dropLabel;
      filename_text.title = selected_file?.name ?? '';
      filename_text.classList.toggle('file-input__filename--selected', Boolean(selected_file));
      show_error(selected_file && !accepts_file(selected_file, native_input.accept) ? `Choose a file matching ${native_input.accept}.` : '');
    }
    function reset_drag_state() {
      drag_depth = 0;
      drop_zone.classList.remove('file-input__drop-zone--active');
    }
    choose_button.setAttribute('aria-describedby', native_input.getAttribute('aria-describedby'));
    choose_button.addEventListener('click', () => native_input.click());
    native_input.addEventListener('change', synchronize_file);
    native_input.addEventListener('invalid', (invalid_event) => { invalid_event.preventDefault(); choose_button.focus(); });
    native_input.form?.addEventListener('reset', () => queueMicrotask(synchronize_file));
    drop_zone.addEventListener('dragenter', (drag_event) => {
      drag_event.preventDefault();
      if (native_input.disabled) return;
      drag_depth += 1;
      drop_zone.classList.add('file-input__drop-zone--active');
    });
    drop_zone.addEventListener('dragover', (drag_event) => {
      drag_event.preventDefault();
      if (drag_event.dataTransfer) drag_event.dataTransfer.dropEffect = native_input.disabled ? 'none' : 'copy';
    });
    drop_zone.addEventListener('dragleave', () => {
      drag_depth -= 1;
      if (drag_depth <= 0) reset_drag_state();
    });
    drop_zone.addEventListener('drop', (drop_event) => {
      drop_event.preventDefault();
      reset_drag_state();
      if (native_input.disabled) return;
      const dropped_files = [...(drop_event.dataTransfer?.files ?? [])];
      if (!dropped_files.length) return;
      if (dropped_files.length !== 1) { show_error('Choose one file at a time.'); return; }
      if (!accepts_file(dropped_files[0], native_input.accept)) { show_error(`Choose a file matching ${native_input.accept}.`); return; }
      native_input.files = drop_event.dataTransfer.files;
      native_input.dispatchEvent(new Event('input', { bubbles: true }));
      native_input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    native_input.tabIndex = -1;
    file_control.classList.add('file-input--enhanced');
    file_control.classList.toggle('file-input--disabled', native_input.disabled);
    synchronize_file();
  }
}
