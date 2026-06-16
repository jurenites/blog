import { TOKEN_RECORDS, TOKEN_VALUES } from "../../../generated/token/tokens.js";

export function token_names(token_prefix) {
  return TOKEN_RECORDS
    .map((token_record) => token_record.name)
    .filter((token_name) => token_name.startsWith(token_prefix));
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
  return TOKEN_VALUES[token_name] || "";
}

export function color_group(token_name) {
  return token_name.split("-")[1] || "";
}

export function token_label(token_name, token_prefix) {
  return token_name.replace(token_prefix, "");
}
