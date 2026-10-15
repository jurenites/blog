// Only the latest settled edit is captured; opening a component does not run tests.
export function create_auto_capture({ read_settings, run_capture, on_status, on_complete, delay_ms = 1000 }) {
  let pending_timer;
  let running_capture = false;
  let is_disposed = false;
  let edit_revision = 0;
  let last_settings = JSON.stringify(read_settings());

  async function capture_latest() {
    if (is_disposed || running_capture) return;
    const capture_settings = read_settings();
    const settings_key = JSON.stringify(capture_settings);
    if (!capture_settings || settings_key === last_settings) { on_status('', false); return; }
    const capture_revision = edit_revision;
    running_capture = true;
    on_status('Capturing Storybook and configured website examples…', true);
    try {
      const capture_result = await run_capture(capture_settings);
      last_settings = settings_key;
      if (!is_disposed && JSON.stringify(read_settings()) === settings_key) {
        on_status('Capture finished.', false);
        await on_complete(capture_result);
      }
    } catch (capture_error) {
      if (!is_disposed) {
        on_status(capture_error.message, Boolean(capture_error.retry_after_ms));
        if (capture_error.retry_after_ms) pending_timer = setTimeout(() => { void capture_latest(); }, capture_error.retry_after_ms);
      }
    } finally {
      running_capture = false;
      if (!is_disposed && capture_revision !== edit_revision) schedule_capture();
    }
  }

  function schedule_capture() {
    if (is_disposed) return;
    edit_revision += 1;
    clearTimeout(pending_timer);
    const capture_settings = read_settings();
    if (!running_capture) {
      if (!capture_settings) { on_status('Complete the Storybook URL, selector and viewport to capture automatically.', false); return; }
      if (JSON.stringify(capture_settings) === last_settings) { on_status('', false); return; }
    }
    on_status(running_capture ? 'Settings changed. The latest settings will be captured next…' : 'Settings saved. Capture starts when you finish editing…', true);
    pending_timer = setTimeout(() => { void capture_latest(); }, delay_ms);
  }

  return {
    schedule_capture,
    dispose() { is_disposed = true; clearTimeout(pending_timer); },
  };
}
