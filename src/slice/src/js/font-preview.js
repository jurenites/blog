import { parse as parse_font } from "opentype.js";
import {
  create_font_metadata,
  create_glyph_metric_viewport,
  create_glyph_inventory,
  format_unicode_code_point,
  group_glyph_inventory,
  glyph_unicode_mappings,
  serialize_glyph_path,
} from "./font-preview-data.js";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const FONT_PROMISES = new Map();
const glyph_group_labels = {
  numeric: "Numbers",
  "latin-uppercase": "Latin capital letters",
  "roundabout-extended-uppercase": "Roundabout extended capital letters",
  "latin-lowercase": "Latin lowercase letters",
  "cyrillic-uppercase": "Cyrillic capital letters",
  "cyrillic-lowercase": "Cyrillic lowercase letters",
  "greek-uppercase": "Greek capital letters",
  "roundabout-alternate-set": "Roundabout alternate glyph set",
  "greek-lowercase": "Greek lowercase letters",
  "keyboard-symbols": "Keyboard symbols",
};

function translated_label(source_label) {
  if (typeof Drupal === "undefined") {
    return source_label;
  }
  // Literal calls let Drupal extract these labels into its browser catalogue.
  const translated_labels = {
    "Numbers": Drupal.t("Numbers"),
    "Latin capital letters": Drupal.t("Latin capital letters"),
    "Roundabout extended capital letters": Drupal.t("Roundabout extended capital letters"),
    "Latin lowercase letters": Drupal.t("Latin lowercase letters"),
    "Cyrillic capital letters": Drupal.t("Cyrillic capital letters"),
    "Cyrillic lowercase letters": Drupal.t("Cyrillic lowercase letters"),
    "Greek capital letters": Drupal.t("Greek capital letters"),
    "Roundabout alternate glyph set": Drupal.t("Roundabout alternate glyph set"),
    "Greek lowercase letters": Drupal.t("Greek lowercase letters"),
    "Keyboard symbols": Drupal.t("Keyboard symbols"),
    "Hide additional glyphs": Drupal.t("Hide additional glyphs"),
    "Show additional glyphs": Drupal.t("Show additional glyphs"),
    "Displayed Unicode mappings": Drupal.t("Displayed Unicode mappings"),
    "Family": Drupal.t("Family"),
    "Style": Drupal.t("Style"),
    "Full name": Drupal.t("Full name"),
    "PostScript name": Drupal.t("PostScript name"),
    "Version": Drupal.t("Version"),
    "Copyright": Drupal.t("Copyright"),
    "License": Drupal.t("License"),
    "License URL": Drupal.t("License URL"),
    "Designer": Drupal.t("Designer"),
    "Description": Drupal.t("Description"),
    "Units per em": Drupal.t("Units per em"),
    "Ascender": Drupal.t("Ascender"),
    "Descender": Drupal.t("Descender"),
    "Glyph count": Drupal.t("Glyph count"),
    "Not embedded": Drupal.t("Not embedded"),
    "Glyph details": Drupal.t("Glyph details"),
    "Inspect": Drupal.t("Inspect"),
    "Character": Drupal.t("Character"),
    "Glyph": Drupal.t("Glyph"),
    "Unicode": Drupal.t("Unicode"),
    "drawable Unicode mappings": Drupal.t("drawable Unicode mappings"),
    "Font details could not load. The local download is still available.": Drupal.t("Font details could not load. The local download is still available."),
  };
  return translated_labels[source_label] ?? Drupal.t(source_label);
}

export function load_font_asset(font_url) {
  if (!FONT_PROMISES.has(font_url)) {
    const font_promise = fetch(font_url, { credentials: "same-origin" })
      .then((font_response) => {
        if (!font_response.ok) {
          throw new Error(`Font request failed with ${font_response.status}.`);
        }
        return font_response.arrayBuffer();
      })
      .then((font_buffer) => parse_font(font_buffer));
    FONT_PROMISES.set(font_url, font_promise);
  }

  return FONT_PROMISES.get(font_url);
}

function create_svg_element(owner_document, element_name, class_name = "") {
  const svg_element = owner_document.createElementNS(SVG_NAMESPACE, element_name);
  if (class_name) {
    svg_element.setAttribute("class", class_name);
  }
  return svg_element;
}

function add_metric_line(svg_element, line_class, first_x, first_y, second_x, second_y) {
  const metric_line = create_svg_element(svg_element.ownerDocument, "line", line_class);
  metric_line.setAttribute("x1", first_x);
  metric_line.setAttribute("y1", first_y);
  metric_line.setAttribute("x2", second_x);
  metric_line.setAttribute("y2", second_y);
  svg_element.append(metric_line);
}

function add_path_points(svg_element, path_commands) {
  path_commands.forEach((path_command) => {
    const control_coordinates = [
      [path_command.x1, path_command.y1],
      [path_command.x2, path_command.y2],
    ].filter(([point_x, point_y]) => Number.isFinite(point_x) && Number.isFinite(point_y));
    const endpoint_coordinates = [path_command.x, path_command.y];

    control_coordinates.forEach(([point_x, point_y]) => {
      const control_point = create_svg_element(
        svg_element.ownerDocument,
        "circle",
        "font-preview__glyph-point font-preview__glyph-point--control",
      );
      control_point.setAttribute("cx", point_x);
      control_point.setAttribute("cy", point_y);
      control_point.setAttribute("r", "10");
      svg_element.append(control_point);
    });

    if (Number.isFinite(endpoint_coordinates[0]) && Number.isFinite(endpoint_coordinates[1])) {
      const endpoint_marker = create_svg_element(
        svg_element.ownerDocument,
        "rect",
        "font-preview__glyph-point font-preview__glyph-point--endpoint",
      );
      endpoint_marker.setAttribute("x", endpoint_coordinates[0] - 10);
      endpoint_marker.setAttribute("y", endpoint_coordinates[1] - 10);
      endpoint_marker.setAttribute("rx", "2");
      endpoint_marker.setAttribute("width", "20");
      endpoint_marker.setAttribute("height", "20");
      svg_element.append(endpoint_marker);
    }
  });
}

function render_glyph_vector(svg_element, font_record, glyph_record) {
  svg_element.replaceChildren();
  const units_per_em = font_record.unitsPerEm;
  const glyph_viewport = create_glyph_metric_viewport(font_record);
  const advance_width = glyph_record.advanceWidth || units_per_em;
  const visual_path = glyph_record.getPath(
    0,
    glyph_viewport.baseline_y,
    units_per_em,
    {},
    font_record,
  );
  const view_padding = Math.max(1, Math.round(units_per_em / 10));
  const view_width = Math.max(advance_width, units_per_em) + (view_padding * 2);
  const view_start_x = -view_padding;
  const view_end_x = view_start_x + view_width;

  svg_element.setAttribute(
    "viewBox",
    `${view_start_x} ${glyph_viewport.view_start_y} ${view_width} ${glyph_viewport.view_height}`,
  );
  add_metric_line(
    svg_element,
    "font-preview__metric-line",
    view_start_x,
    glyph_viewport.view_start_y,
    view_end_x,
    glyph_viewport.view_start_y,
  );
  add_metric_line(
    svg_element,
    "font-preview__metric-line",
    view_start_x,
    glyph_viewport.overshoot_divider_y,
    view_end_x,
    glyph_viewport.overshoot_divider_y,
  );
  add_metric_line(
    svg_element,
    "font-preview__metric-line font-preview__metric-line--ascender",
    view_start_x,
    glyph_viewport.ascender_y,
    view_end_x,
    glyph_viewport.ascender_y,
  );
  add_metric_line(
    svg_element,
    "font-preview__metric-line font-preview__metric-line--baseline",
    view_start_x,
    glyph_viewport.baseline_y,
    view_end_x,
    glyph_viewport.baseline_y,
  );
  add_metric_line(
    svg_element,
    "font-preview__metric-line font-preview__metric-line--descender",
    view_start_x,
    glyph_viewport.descender_y,
    view_end_x,
    glyph_viewport.descender_y,
  );
  add_metric_line(
    svg_element,
    "font-preview__metric-line",
    0,
    glyph_viewport.view_start_y,
    0,
    glyph_viewport.view_height,
  );
  add_metric_line(
    svg_element,
    "font-preview__metric-line",
    advance_width,
    glyph_viewport.view_start_y,
    advance_width,
    glyph_viewport.view_height,
  );

  const outline_path = create_svg_element(
    svg_element.ownerDocument,
    "path",
    "font-preview__glyph-outline",
  );
  outline_path.setAttribute("d", visual_path.toPathData({ decimalPlaces: 2, flipY: false }));
  svg_element.append(outline_path);
  add_path_points(svg_element, visual_path.commands);
}

function render_metadata_table(metadata_body, font_record, displayed_mapping_count) {
  const owner_document = metadata_body.ownerDocument;
  const font_metadata = [
    ...create_font_metadata(font_record),
    ["Displayed Unicode mappings", String(displayed_mapping_count)],
  ];
  const metadata_rows = font_metadata.map(([metadata_label, metadata_value]) => {
    const table_row = owner_document.createElement("tr");
    const table_heading = owner_document.createElement("th");
    const table_value = owner_document.createElement("td");
    table_heading.scope = "row";
    table_heading.textContent = translated_label(metadata_label);
    table_value.textContent = metadata_value === "Not embedded" ? translated_label(metadata_value) : metadata_value;
    table_row.append(table_heading, table_value);
    return table_row;
  });
  metadata_body.replaceChildren(...metadata_rows);
}

function populate_glyph_dialog(font_preview, font_record, glyph_mapping) {
  const glyph_record = glyph_mapping.glyph_record;
  font_preview.querySelector("[data-glyph-dialog-title]").textContent =
    `${translated_label("Glyph details")}: ${glyph_mapping.glyph_name}`;
  font_preview.querySelector("[data-glyph-name]").textContent = glyph_mapping.glyph_name;
  font_preview.querySelector("[data-glyph-unicode]").textContent = glyph_unicode_mappings(glyph_record);
  font_preview.querySelector("[data-glyph-index]").textContent = String(glyph_mapping.glyph_index);
  font_preview.querySelector("[data-glyph-width]").textContent = String(glyph_record.advanceWidth ?? "—");
  font_preview.querySelector("[data-glyph-bearing]").textContent = String(glyph_record.leftSideBearing ?? "—");
  font_preview.querySelector("[data-glyph-path]").textContent = serialize_glyph_path(glyph_record);
  render_glyph_vector(font_preview.querySelector("[data-glyph-svg]"), font_record, glyph_record);
}

function show_glyph_dialog(glyph_dialog) {
  if (typeof glyph_dialog.showModal === "function") {
    glyph_dialog.showModal();
  }
  else {
    glyph_dialog.setAttribute("open", "");
    glyph_dialog.scrollIntoView({ block: "nearest" });
  }
}

function open_glyph_dialog(font_preview, glyph_button) {
  const owner_document = font_preview.ownerDocument;
  const glyph_dialog = font_preview.querySelector("[data-font-preview-dialog]");
  const glyph_visual = font_preview.querySelector("[data-font-preview-glyph-transition-target]");
  const reduced_motion_requested = owner_document.defaultView
    ?.matchMedia("(prefers-reduced-motion: reduce)").matches ?? false;
  const shared_transition_available = typeof owner_document.startViewTransition === "function"
    && typeof glyph_dialog.showModal === "function"
    && glyph_visual
    && !reduced_motion_requested;

  if (!shared_transition_available) {
    show_glyph_dialog(glyph_dialog);
    return;
  }

  const clear_transition_markers = () => {
    glyph_button.removeAttribute("data-font-preview-glyph-transition-source");
    glyph_visual.removeAttribute("data-font-preview-glyph-transition-active");
  };

  glyph_button.setAttribute("data-font-preview-glyph-transition-source", "");

  try {
    const glyph_view_transition = owner_document.startViewTransition(() => {
      glyph_button.removeAttribute("data-font-preview-glyph-transition-source");
      glyph_visual.setAttribute("data-font-preview-glyph-transition-active", "");
      glyph_dialog.showModal();
    });
    glyph_view_transition.finished.then(clear_transition_markers, clear_transition_markers);
  }
  catch (_transition_error) {
    clear_transition_markers();
    show_glyph_dialog(glyph_dialog);
  }
}

function create_glyph_tile(font_preview, font_record, glyph_mapping) {
  const owner_document = font_preview.ownerDocument;
  const glyph_button = owner_document.createElement("button");
  const glyph_character = owner_document.createElement("span");
  const unicode_label = format_unicode_code_point(glyph_mapping.code_point);

  glyph_button.className = "font-preview__glyph-tile";
  glyph_button.type = "button";
  glyph_button.setAttribute(
    "aria-label",
    `${translated_label("Inspect")} ${glyph_mapping.glyph_name}, ${unicode_label}`,
  );
  glyph_button.dataset.tooltipTrigger = "";
  glyph_button.dataset.tooltipColorVariant = "full-black";
  glyph_button.dataset.tooltipLabel = [
    `${translated_label("Character")}: ${glyph_mapping.character}`,
    `${translated_label("Glyph")}: ${glyph_mapping.glyph_name}`,
    `${translated_label("Unicode")}: ${unicode_label}`,
  ].join(" · ");
  glyph_character.className = "font-preview__glyph-character";
  glyph_character.textContent = glyph_mapping.character;
  glyph_button.append(glyph_character);
  glyph_button.addEventListener("click", () => {
    font_preview.jurenites_font_preview_opener = glyph_button;
    populate_glyph_dialog(font_preview, font_record, glyph_mapping);
    open_glyph_dialog(font_preview, glyph_button);
  });
  return glyph_button;
}

function create_glyph_group(font_preview, font_record, glyph_group) {
  const owner_document = font_preview.ownerDocument;
  const glyph_group_container = owner_document.createElement("section");
  const glyph_grid = owner_document.createElement("div");
  const group_label = translated_label(glyph_group_labels[glyph_group.group_name]);
  const glyph_tiles = glyph_group.glyph_mappings.map((glyph_mapping) =>
    create_glyph_tile(font_preview, font_record, glyph_mapping));

  glyph_group_container.className = "font-preview__glyph-group";
  glyph_group_container.dataset.glyphGroup = glyph_group.group_name;
  glyph_group_container.setAttribute("aria-label", group_label);
  glyph_grid.className = "font-preview__glyph-grid";
  glyph_grid.append(...glyph_tiles);
  glyph_group_container.append(glyph_grid);
  return glyph_group_container;
}

function set_additional_glyph_visibility(more_glyphs_toggle, additional_glyph_region, is_visible) {
  const additional_glyph_count = more_glyphs_toggle.dataset.additionalGlyphCount;
  const action_label = is_visible ? "Hide additional glyphs" : "Show additional glyphs";
  more_glyphs_toggle.setAttribute("aria-expanded", String(is_visible));
  more_glyphs_toggle.setAttribute(
    "aria-label",
    `${translated_label(action_label)} (${additional_glyph_count})`,
  );
  additional_glyph_region.hidden = !is_visible;
}

function set_path_data_visibility(path_data_toggle, path_data_region, is_visible) {
  const action_label = is_visible
    ? path_data_toggle.dataset.pathHideLabel
    : path_data_toggle.dataset.pathShowLabel;
  path_data_toggle.setAttribute("aria-expanded", String(is_visible));
  path_data_toggle.setAttribute("aria-label", action_label);
  path_data_region.hidden = !is_visible;
}

export async function initialize_font_preview(font_preview) {
  if (font_preview.jurenites_font_preview_initialized) {
    return;
  }
  font_preview.jurenites_font_preview_initialized = true;

  const status_message = font_preview.querySelector("[data-font-preview-status]");
  const primary_glyph_groups = font_preview.querySelector("[data-font-preview-primary-groups]");
  const additional_glyph_grid = font_preview.querySelector("[data-font-preview-additional-grid]");
  const additional_glyph_region = font_preview.querySelector("[data-font-preview-additional-region]");
  const more_glyphs_toggle = font_preview.querySelector("[data-font-preview-additional-toggle]");
  const metadata_body = font_preview.querySelector("[data-font-preview-metadata]");
  const glyph_dialog = font_preview.querySelector("[data-font-preview-dialog]");
  const close_button = font_preview.querySelector("[data-font-preview-close]");
  const path_data_toggle = font_preview.querySelector("[data-font-preview-path-toggle]");
  const path_data_region = font_preview.querySelector("[data-font-preview-path-region]");

  close_button?.addEventListener("click", () => glyph_dialog.close());
  glyph_dialog?.addEventListener("close", () => {
    font_preview.jurenites_font_preview_opener?.focus();
  });
  more_glyphs_toggle?.addEventListener("click", () => {
    const additional_is_visible = more_glyphs_toggle.getAttribute("aria-expanded") !== "true";
    set_additional_glyph_visibility(
      more_glyphs_toggle,
      additional_glyph_region,
      additional_is_visible,
    );
  });
  path_data_toggle?.addEventListener("click", () => {
    const path_data_is_visible = path_data_toggle.getAttribute("aria-expanded") !== "true";
    set_path_data_visibility(path_data_toggle, path_data_region, path_data_is_visible);
  });
  if (path_data_toggle && path_data_region) {
    set_path_data_visibility(path_data_toggle, path_data_region, false);
  }

  try {
    const font_record = await load_font_asset(font_preview.dataset.fontUrl);
    const glyph_inventory = create_glyph_inventory(font_record);
    const grouped_inventory = group_glyph_inventory(
      glyph_inventory,
      font_preview.dataset.fontIdentifier,
    );
    const primary_group_elements = grouped_inventory.primary_groups.map((glyph_group) =>
      create_glyph_group(font_preview, font_record, glyph_group));
    const additional_glyph_tiles = grouped_inventory.additional_mappings.map((glyph_mapping) =>
      create_glyph_tile(font_preview, font_record, glyph_mapping));
    primary_glyph_groups.replaceChildren(...primary_group_elements);
    additional_glyph_grid.replaceChildren(...additional_glyph_tiles);
    more_glyphs_toggle.dataset.additionalGlyphCount = String(additional_glyph_tiles.length);
    more_glyphs_toggle.hidden = additional_glyph_tiles.length === 0;
    set_additional_glyph_visibility(more_glyphs_toggle, additional_glyph_region, false);
    render_metadata_table(metadata_body, font_record, glyph_inventory.length);
    status_message.textContent = `${glyph_inventory.length} ${translated_label("drawable Unicode mappings")}`;
    font_preview.dataset.enhancementState = "ready";
  }
  catch (_font_error) {
    status_message.textContent = translated_label(
      "Font details could not load. The local download is still available.",
    );
    font_preview.dataset.enhancementState = "error";
  }
}

export function initialize_font_previews(font_preview_context) {
  font_preview_context
    .querySelectorAll("[data-jurenites-font-preview]")
    .forEach((font_preview) => initialize_font_preview(font_preview));
}
