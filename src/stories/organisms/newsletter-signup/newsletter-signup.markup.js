import newsletter_signup_template from "./newsletter-signup.template.html?raw";
import { button_markup } from "../../atoms/button/button.markup.js";
import { text_input_markup } from "../../atoms/text-input/text-input.markup.js";
import { escape_html, render_template } from "../../template.js";

export function newsletter_signup_markup({
  eyebrow_heading,
  signup_title,
  signup_description,
  email_placeholder,
  button_label,
  privacy_note,
  form_action = "#",
}) {
  return render_template(newsletter_signup_template, {
    eyebrow_heading: escape_html(eyebrow_heading),
    signup_title: escape_html(signup_title),
    signup_description: escape_html(signup_description),
    form_action: escape_html(form_action),
    email_field: text_input_markup({
      input_id: "newsletter-email",
      input_label: "Email address",
      input_name: "newsletter_email",
      input_type: "email",
      input_placeholder: email_placeholder,
      hint_text: "One useful note at a time.",
      is_required: true,
      input_action: button_markup({ button_label }),
    }),
    privacy_note: escape_html(privacy_note),
  });
}
