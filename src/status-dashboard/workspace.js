const STORAGE_PREFIX = 'jurenites-review-workspace:';

export function read_component_workspace(component_id, server_state = {}) {
  try {
    const local_state = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}${component_id}`) ?? 'null');
    return local_state?.pending_save || Date.parse(local_state?.updated_at) > Date.parse(server_state.updated_at ?? '1970-01-01T00:00:00Z') ? local_state : server_state;
  } catch { return server_state; }
}

export function connect_workspace({ component_id, initial_state, review_token, on_saved }) {
  let workspace_state = structuredClone(initial_state ?? {});
  let pending_save;
  let queued_save = Promise.resolve();
  let change_revision = 0;
  const status_element = document.querySelector('[data-autosave-status]');
  function show_status(status_text) {
    if (status_element?.isConnected) status_element.textContent = status_text;
  }
  function remember_locally() {
    try { localStorage.setItem(`${STORAGE_PREFIX}${component_id}`, JSON.stringify(workspace_state)); }
    catch { show_status('Local storage unavailable · saving to disk'); }
  }
  function update_settings(workspace_patch, png_data) {
    change_revision += 1;
    workspace_state = { ...workspace_state, ...workspace_patch, pending_save: true, updated_at: new Date().toISOString() };
    remember_locally();
    show_status('Saving…');
    clearTimeout(pending_save);
    if (png_data) void flush_settings(png_data);
    else pending_save = setTimeout(() => { void flush_settings(); }, 250);
  }
  function flush_settings(png_data) {
    clearTimeout(pending_save);
    const request_revision = change_revision;
    const request_state = structuredClone(workspace_state);
    queued_save = queued_save.catch(() => {}).then(async () => {
      try {
        const save_response = await fetch('/api/workspace', {
          method: 'POST', keepalive: !png_data && JSON.stringify(request_state).length < 48000,
          headers: { 'content-type': 'application/json', 'x-review-token': review_token },
          body: JSON.stringify({ component_id, workspace_patch: request_state, ...(png_data ? { png_data } : {}) }),
        });
        const saved_state = await save_response.json();
        if (!save_response.ok) throw new Error(saved_state.error ?? 'Could not save settings');
        on_saved?.(saved_state);
        if (request_revision === change_revision) {
          workspace_state = { ...saved_state, pending_save: false };
          remember_locally();
          show_status('Saved');
        }
      } catch {
        remember_locally();
        show_status('Saved locally · disk save pending');
      }
    });
    return queued_save;
  }
  const pagehide_handler = () => { if (workspace_state.pending_save) void flush_settings(); };
  window.addEventListener('pagehide', pagehide_handler);
  if (workspace_state.pending_save) void flush_settings();
  else show_status(workspace_state.updated_at ? 'Saved' : 'Changes save automatically');
  return {
    update_settings,
    current_state: () => workspace_state,
    flush_settings,
    disconnect() {
      window.removeEventListener('pagehide', pagehide_handler);
      if (workspace_state.pending_save) void flush_settings();
    },
  };
}
