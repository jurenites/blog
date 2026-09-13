(function (drupal_api, jquery_api) {
  const attached_models = new Set();
  let active_model = null;
  let pointer_target = null;

  function select_contextual_target(target_element) {
    let target_region = target_element?.closest?.('.contextual-region');
    let target_model = null;
    while (target_region && !target_model) {
      target_model = [...attached_models].find((contextual_model) => contextual_model.$region[0] === target_region);
      target_region = target_region.parentElement?.closest('.contextual-region');
    }
    if (target_model === active_model) return;
    active_model = target_model;
    attached_models.forEach((contextual_model) => {
      contextual_model.$contextual.toggleClass('contextual--targeted', contextual_model === active_model);
      if (contextual_model !== active_model) {
        contextual_model.close().blur();
        contextual_model.render();
      }
    });
  }

  function attach_contextual_menu(contextual_model) {
    if (attached_models.has(contextual_model)) return;
    attached_models.add(contextual_model);
    contextual_model.isLocked = false;
    contextual_model.render();
    contextual_model.$contextual.on('mouseenter.jurenitesEditorial', () => {
      select_contextual_target(contextual_model.$contextual[0]);
      contextual_model.isOpen = true;
      contextual_model.render();
    });
    contextual_model.$contextual.on('mouseleave.jurenitesEditorial', () => {
      if (!contextual_model.$contextual[0].contains(document.activeElement)) {
        contextual_model.close();
        contextual_model.render();
      }
    });
    // Include controls that arrive after a Views/progressive-loading response.
    select_contextual_target(pointer_target);
  }

  jquery_api(document).on('pointerover.jurenitesEditorial', (pointer_event) => {
    pointer_target = pointer_event.target;
    select_contextual_target(pointer_target);
  });
  jquery_api(document).on('pointerout.jurenitesEditorial', (pointer_event) => {
    if (!pointer_event.relatedTarget) {
      pointer_target = null;
      select_contextual_target(document.activeElement);
    }
  });
  jquery_api(document).on('focusin.jurenitesEditorial', (focus_event) => {
    select_contextual_target(focus_event.target);
  });
  jquery_api(document).on('focusout.jurenitesEditorial', (focus_event) => {
    select_contextual_target(focus_event.relatedTarget || pointer_target);
  });
  jquery_api(document).on('drupalContextualLinkAdded.jurenitesEditorial', (_event_data, contextual_data) => {
    attach_contextual_menu(contextual_data.model);
  });
  drupal_api.contextual.instances.forEach(attach_contextual_menu);
})(Drupal, jQuery);
