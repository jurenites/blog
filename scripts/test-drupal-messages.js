// Paste this entire file into DevTools Console on a Drupal frontend page.
// Re-run to replace only these test messages, in status/warning/error order.
(async () => {
  const drupal_api = window.Drupal;
  if (!drupal_api) {
    throw new Error("Open a Drupal frontend page before running this test.");
  }

  const base_path = window.drupalSettings?.path?.baseUrl || "/";
  async function load_core_script(script_name) {
    await new Promise((resolve_load, reject_load) => {
      const script_element = document.createElement("script");
      script_element.src = `${base_path}core/misc/${script_name}.js`;
      script_element.onload = resolve_load;
      script_element.onerror = () => reject_load(new Error(`Could not load ${script_element.src}`));
      document.head.appendChild(script_element);
    });
  }

  if (!drupal_api.debounce) await load_core_script("debounce");
  if (!drupal_api.announce) await load_core_script("announce");
  drupal_api.behaviors.drupalAnnounce.attach(document);
  if (!drupal_api.Message) await load_core_script("message");

  const message_area = document.querySelector(
    "[data-drupal-messages], [data-drupal-messages-fallback]",
  );
  if (!message_area) {
    throw new Error("No Drupal message region on this page. Check the Status messages block placement.");
  }

  const message_api = new drupal_api.Message();
  const message_types = ["status", "warning", "error"];
  for (const message_type of message_types) {
    const message_id = `jurenites-message-test-${message_type}`;
    if (message_api.select(message_id)) message_api.remove(message_id);
  }
  message_types.forEach((message_type, message_index) => {
    message_api.add(`TEST ${message_index + 1}/3 — Drupal ${message_type} message.`, {
      type: message_type,
      id: `jurenites-message-test-${message_type}`,
    });
  });
  if (window.getComputedStyle(message_area).position !== "fixed") {
    message_area.scrollIntoView({ block: "center" });
  }
  console.table(message_types.map((message_type) => {
    const message_element = message_api.select(`jurenites-message-test-${message_type}`);
    const computed_styles = window.getComputedStyle(message_element);
    return {
      message_type,
      message_role: message_element.getAttribute("role"),
      message_position: computed_styles.position,
      message_text: message_element.textContent,
    };
  }));
})();
