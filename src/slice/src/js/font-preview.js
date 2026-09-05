import { parse as parse_font } from "opentype.js";
import {
  create_font_metadata,
  create_glyph_inventory,
  format_unicode_code_point,
  glyph_unicode_mappings,
  serialize_glyph_path,
} from "./font-preview-data.js";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const FONT_PROMISES = new Map();

function translated_label(source_label) {
  return typeof Drupal !== "undefined" ? Drupal.t(source_label) : source_label;
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
  const baseline_y = font_record.ascender;
  const advance_width = glyph_record.advanceWidth || units_per_em;
  const visual_path = glyph_record.getPath(0, baseline_y, units_per_em, {}, font_record);
  const view_padding = Math.max(1, Math.round(units_per_em / 10));
  const view_width = Math.max(advance_width, units_per_em) + (view_padding * 2);
  const view_height = (font_record.ascender - font_record.descender) + (view_padding * 2);
  const view_start_x = -view_padding;
  const view_start_y = -view_padding;
  const view_end_x = view_start_x + view_width;
  const descender_y = baseline_y - font_record.descender;

  svg_element.setAttribute(
    "viewBox",
    `${view_start_x} ${view_start_y} ${view_width} ${view_height}`,
  );
  add_metric_line(svg_element, "font-preview__metric-line", view_start_x, 0, view_end_x, 0);
  add_metric_line(
    svg_element,
    "font-preview__metric-line font-preview__metric-line--baseline",
    view_start_x,
    baseline_y,
    view_end_x,
    baseline_y,
  );
  add_metric_line(
    svg_element,
    "font-preview__metric-line",
    view_start_x,
    descender_y,
    view_end_x,
    descender_y,
  );
  add_metric_line(svg_element, "font-preview__metric-line", 0, view_start_y, 0, view_height);
  add_metric_line(
    svg_element,
    "font-preview__metric-line",
    advance_width,
    view_start_y,
    advance_width,
    view_height,
  );

  const outline_path = create_svg_element(
    svg_element.ownerDocument,
    "path",
    "font-preview__glyph-outline",
  );
  outline_path.setAttribute("d", visual_path.toPathData({ decimalPlaces: 2 }));
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
    table_value.textContent = metadata_value;
    table_row.append(table_heading, table_value);
    return table_row;
  });
  metadata_body.replaceChildren(...metadata_rows);
}

function populate_glyph_dialog(font_preview, font_record, glyph_mapping) {
  const glyph_record = glyph_mapping.glyph_record;
  const glyph_dialog = font_preview.querySelector("[data-font-preview-dialog]");
  font_preview.querySelector("[data-glyph-dialog-title]").textContent =
    `${translated_label("Glyph details")}: ${glyph_mapping.glyph_name}`;
  font_preview.querySelector("[data-glyph-name]").textContent = glyph_mapping.glyph_name;
  font_preview.querySelector("[data-glyph-unicode]").textContent = glyph_unicode_mappings(glyph_record);
  font_preview.querySelector("[data-glyph-index]").textContent = String(glyph_mapping.glyph_index);
  font_preview.querySelector("[data-glyph-width]").textContent = String(glyph_record.advanceWidth ?? "—");
  font_preview.querySelector("[data-glyph-bearing]").textContent = String(glyph_record.leftSideBearing ?? "—");
  font_preview.querySelector("[data-glyph-path]").textContent = serialize_glyph_path(glyph_record);
  render_glyph_vector(font_preview.querySelector("[data-glyph-svg]"), font_record, glyph_record);

  if (typeof glyph_dialog.showModal === "function") {
    glyph_dialog.showModal();
  }
  else {
    glyph_dialog.setAttribute("open", "");
    glyph_dialog.scrollIntoView({ block: "nearest" });
  }
}

function create_glyph_tile(font_preview, font_record, glyph_mapping) {
  const owner_document = font_preview.ownerDocument;
  const glyph_button = owner_document.createElement("button");
  const glyph_character = owner_document.createElement("span");
  const glyph_code_point = owner_document.createElement("span");
  const glyph_name = owner_document.createElement("span");
  const unicode_label = format_unicode_code_point(glyph_mapping.code_point);

  glyph_button.className = "font-preview__glyph-tile";
  glyph_button.type = "button";
  glyph_button.setAttribute(
    "aria-label",
    `${translated_label("Inspect")} ${glyph_mapping.glyph_name}, ${unicode_label}`,
  );
  glyph_button.title = [
    `${translated_label("Character")}: ${glyph_mapping.character}`,
    `${translated_label("Glyph")}: ${glyph_mapping.glyph_name}`,
    `${translated_label("Unicode")}: ${unicode_label}`,
  ].join("\n");
  glyph_character.className = "font-preview__glyph-character";
  glyph_character.textContent = glyph_mapping.character;
  glyph_code_point.className = "font-preview__glyph-code";
  glyph_code_point.textContent = unicode_label;
  glyph_name.className = "font-preview__glyph-name";
  glyph_name.textContent = glyph_mapping.glyph_name;
  glyph_button.append(glyph_character, glyph_code_point, glyph_name);
  glyph_button.addEventListener("click", () => {
    font_preview.jurenites_font_preview_opener = glyph_button;
    populate_glyph_dialog(font_preview, font_record, glyph_mapping);
  });
  return glyph_button;
}

export async function initialize_font_preview(font_preview) {
  if (font_preview.jurenites_font_preview_initialized) {
    return;
  }
  font_preview.jurenites_font_preview_initialized = true;

  const text_input = font_preview.querySelector(".text-input__control");
  const specimen_text = font_preview.querySelector("[data-font-preview-specimen]");
  const status_message = font_preview.querySelector("[data-font-preview-status]");
  const glyph_grid = font_preview.querySelector("[data-font-preview-grid]");
  const metadata_body = font_preview.querySelector("[data-font-preview-metadata]");
  const glyph_dialog = font_preview.querySelector("[data-font-preview-dialog]");
  const close_button = font_preview.querySelector("[data-font-preview-close]");

  text_input?.addEventListener("input", () => {
    specimen_text.textContent = text_input.value || translated_label("Try it yourself");
  });
  close_button?.addEventListener("click", () => glyph_dialog.close());
  glyph_dialog?.addEventListener("close", () => {
    font_preview.jurenites_font_preview_opener?.focus();
  });

  try {
    const font_record = await load_font_asset(font_preview.dataset.fontUrl);
    const glyph_inventory = create_glyph_inventory(font_record);
    const glyph_tiles = glyph_inventory.map((glyph_mapping) =>
      create_glyph_tile(font_preview, font_record, glyph_mapping));
    glyph_grid.replaceChildren(...glyph_tiles);
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
