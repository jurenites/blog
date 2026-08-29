import form_field_template from "./form-field.template.html?raw";
import form_field_group_template from "./form-field-group.template.html?raw";
import { escape_html, render_template } from "../../template.js";
import { select_input_markup } from "../../atoms/select-input/select-input.markup.js";

const GROUP_CONTROL_NAMES = new Set(["radio-group", "checkbox-group", "choice-chips"]);

function option_value_list(choice_options) {
  return String(choice_options)
    .split(",")
    .map((choice_option) => choice_option.trim())
    .filter(Boolean);
}

function selected_value_set(selected_values) {
  return new Set(option_value_list(selected_values).map((selected_value) => selected_value.toLowerCase()));
}

function option_identifier(field_id, option_label) {
  const option_slug = option_label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `${field_id}-${option_slug || "option"}`;
}

function required_indicator_markup(is_required) {
  return is_required ? '<span class="form-field__required" aria-hidden="true"> *</span>' : "";
}

function description_markup(field_id, field_description) {
  if (!field_description) {
    return "";
  }

  return `<p class="form-field__description" id="${escape_html(field_id)}-description">${escape_html(field_description)}</p>`;
}

function validation_error_markup(field_id, validation_state, validation_message) {
  if (validation_state !== "error") {
    return "";
  }

  return `<p class="form-field__error" id="${escape_html(field_id)}-error" role="alert">${escape_html(validation_message)}</p>`;
}

function accessibility_attributes({ field_id, field_description, validation_state, is_required, is_disabled }) {
  const described_by_ids = [];
  if (field_description) {
    described_by_ids.push(`${field_id}-description`);
  }
  if (validation_state === "error") {
    described_by_ids.push(`${field_id}-error`);
  }

  return [
    described_by_ids.length ? `aria-describedby="${escape_html(described_by_ids.join(" "))}"` : "",
    validation_state === "error" ? 'aria-invalid="true"' : "",
    is_required ? "required" : "",
    is_disabled ? "disabled" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function standard_control_markup({
  field_control,
  field_id,
  field_name,
  field_placeholder,
  choice_options,
  selected_values,
  field_description,
  validation_state,
  is_required,
  is_disabled,
}) {
  const control_attributes = accessibility_attributes({
    field_id,
    field_description,
    validation_state,
    is_required,
    is_disabled,
  });
  const escaped_id = escape_html(field_id);
  const escaped_name = escape_html(field_name);
  const escaped_placeholder = escape_html(field_placeholder);

  if (field_control === "textarea") {
    return `<textarea class="form-field__control form-field__control--textarea" id="${escaped_id}" name="${escaped_name}" rows="4" placeholder="${escaped_placeholder}" ${control_attributes}></textarea>`;
  }

  if (field_control === "select") {
    return select_input_markup({
      field_id,
      field_name,
      option_items: option_value_list(choice_options),
      selected_value: selected_values,
      native_class_names: "form-field__control form-field__control--select",
      accessibility_attributes: control_attributes,
    });
  }

  if (field_control === "file-upload") {
    return `<input class="form-field__file" id="${escaped_id}" name="${escaped_name}" type="file" ${control_attributes}>`;
  }

  const input_type = field_control === "password" ? "password" : "text";
  const autocomplete_value = field_control === "password" ? "current-password" : "off";
  return `<input class="form-field__control text-input__control" id="${escaped_id}" name="${escaped_name}" type="${input_type}" autocomplete="${autocomplete_value}" placeholder="${escaped_placeholder}" ${control_attributes}>`;
}

function single_checkbox_markup({
  field_id,
  field_name,
  field_label,
  field_description,
  validation_state,
  is_required,
  is_disabled,
  selected_values,
}) {
  const control_attributes = accessibility_attributes({
    field_id,
    field_description,
    validation_state,
    is_required,
    is_disabled,
  });
  const checked_attribute = selected_value_set(selected_values).has("yes") ? " checked" : "";

  return `<div class="form-field__choice"><input class="form-field__choice-input form-field__choice-input--checkbox" id="${escape_html(field_id)}" name="${escape_html(field_name)}" type="checkbox" value="yes" ${control_attributes}${checked_attribute}><label class="form-field__choice-label" for="${escape_html(field_id)}">${escape_html(field_label)}${required_indicator_markup(is_required)}</label></div>`;
}

function choice_group_markup({
  field_control,
  field_id,
  field_name,
  choice_options,
  selected_values,
  field_description,
  validation_state,
  is_required,
  is_disabled,
}) {
  const selected_options = selected_value_set(selected_values);
  const input_type = field_control === "checkbox-group" ? "checkbox" : "radio";
  const control_name = input_type === "checkbox" ? `${field_name}[]` : field_name;

  return option_value_list(choice_options)
    .map((choice_option) => {
      const choice_id = option_identifier(field_id, choice_option);
      const choice_value = choice_option.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const checked_attribute = selected_options.has(choice_option.toLowerCase()) ? " checked" : "";
      const required_choice = is_required && input_type === "radio";
      const choice_attributes = accessibility_attributes({
        field_id,
        field_description,
        validation_state,
        is_required: required_choice,
        is_disabled,
      });
      const input_class_name = field_control === "choice-chips"
        ? "form-field__chip-input"
        : `form-field__choice-input form-field__choice-input--${input_type}`;
      const label_class_name = field_control === "choice-chips"
        ? "form-field__chip-label"
        : "form-field__choice-label";

      return `<div class="form-field__choice"><input class="${input_class_name}" id="${escape_html(choice_id)}" name="${escape_html(control_name)}" type="${input_type}" value="${escape_html(choice_value)}" ${choice_attributes}${checked_attribute}><label class="${label_class_name}" for="${escape_html(choice_id)}">${escape_html(choice_option)}</label></div>`;
    })
    .join("");
}

export function form_field_markup({
  field_data_type,
  field_control,
  field_id,
  field_name,
  field_label,
  field_placeholder,
  field_description,
  validation_state,
  validation_message,
  choice_options,
  selected_values,
  is_required,
  is_disabled,
}) {
  const field_error_markup = validation_error_markup(field_id, validation_state, validation_message);
  const field_description_markup = description_markup(field_id, field_description);
  const error_class_name = validation_state === "error" ? " form-field--error" : "";
  const disabled_class_name = is_disabled ? " form-field--disabled" : "";
  const form_field_classes = `${error_class_name}${disabled_class_name}`;

  if (GROUP_CONTROL_NAMES.has(field_control)) {
    return render_template(form_field_group_template, {
      choice_layout: field_control === "choice-chips" ? "chips" : "stacked",
      field_control_markup: choice_group_markup({
        field_control,
        field_id,
        field_name,
        choice_options,
        selected_values,
        field_description,
        validation_state,
        is_required,
        is_disabled,
      }),
      field_description_markup,
      field_data_type: escape_html(field_data_type),
      field_error_markup,
      field_label_text: escape_html(field_label),
      fieldset_attributes: is_disabled ? " disabled" : "",
      form_field_classes,
      required_markup: required_indicator_markup(is_required),
    });
  }

  if (field_control === "single-checkbox") {
    return render_template(form_field_template, {
      field_control_markup: single_checkbox_markup({
        field_id,
        field_name,
        field_label,
        field_description,
        validation_state,
        is_required,
        is_disabled,
        selected_values,
      }),
      field_description_markup,
      field_data_type: escape_html(field_data_type),
      field_error_markup,
      field_label_markup: "",
      form_field_classes: `${form_field_classes} form-field--single-choice`,
    });
  }

  return render_template(form_field_template, {
    field_control_markup: standard_control_markup({
      field_control,
      field_id,
      field_name,
      field_placeholder,
      choice_options,
      selected_values,
      field_description,
      validation_state,
      is_required,
      is_disabled,
    }),
    field_description_markup,
    field_data_type: escape_html(field_data_type),
    field_error_markup,
    field_label_markup: `<label class="form-field__label" for="${escape_html(field_id)}">${escape_html(field_label)}${required_indicator_markup(is_required)}</label>`,
    form_field_classes,
  });
}
