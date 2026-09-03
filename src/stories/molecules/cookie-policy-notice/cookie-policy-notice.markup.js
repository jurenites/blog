import { button_markup } from "../../atoms/button/button.markup.js";
import { escape_html, render_template } from "../../template.js";
import cookie_policy_notice_template from "./cookie-policy-notice.template.html?raw";

export function cookie_policy_notice_markup({
  notice_heading,
  notice_message,
  closing_message,
  dismiss_button_label,
}) {
  return render_template(cookie_policy_notice_template, {
    closing_message: escape_html(closing_message),
    dismiss_button: button_markup({
      additional_class_names: "cookie-policy-notice__dismiss",
      button_label: dismiss_button_label,
      style_variant: "secondary",
    }),
    notice_heading: escape_html(notice_heading),
    notice_message: escape_html(notice_message),
  });
}
