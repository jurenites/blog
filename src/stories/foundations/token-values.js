function root_style_rules() {
  if (typeof document === "undefined") {
    return [];
  }
  return Array.from(document.styleSheets).flatMap((sheet_item) => {
    try {
      return Array.from(sheet_item.cssRules || []);
    } catch {
      return [];
    }
  });
}

function root_variable_names() {
  const name_set = new Set();
  for (const rule_item of root_style_rules()) {
    if (!rule_item.selectorText || !rule_item.selectorText.split(",").map((item) => item.trim()).includes(":root")) {
      continue;
    }
    for (const property_name of Array.from(rule_item.style)) {
      if (property_name.startsWith("--")) {
        name_set.add(property_name.slice(2));
      }
    }
  }
  return Array.from(name_set);
}

export function token_names(token_prefix) {
  return root_variable_names().filter((token_name) => token_name.startsWith(token_prefix));
}

export function token_option_names(token_prefix) {
  return token_names(token_prefix).map((token_name) => token_name.replace(token_prefix, ""));
}

export function token_first_option(token_prefix) {
  return token_option_names(token_prefix)[0] || "";
}

export function token_default_option(default_token_name, token_prefix) {
  return token_value(default_token_name) || token_first_option(token_prefix);
}

export function typography_role_names() {
  return token_names("typography-")
    .filter((token_name) => token_name.endsWith("-font-size"))
    .map((token_name) => token_name.replace(/^typography-/, "").replace(/-font-size$/, ""));
}

export function token_value(token_name) {
  if (typeof document === "undefined") {
    return "";
  }
  return getComputedStyle(document.documentElement).getPropertyValue(`--${token_name}`).trim();
}

export function color_group(token_name) {
  return token_name.split("-")[1] || "";
}

export function token_label(token_name, token_prefix) {
  return token_name.replace(token_prefix, "");
}
