import control_template from "./pagination-control.template.html?raw";
import page_template from "./pagination-page.template.html?raw";
import pagination_template from "./pagination.template.html?raw";
import { escape_html, render_template } from "../../template.js";

function pagination_entries(current_page, page_count) {
  if (page_count <= 7) {
    return Array.from({ length: page_count }, (_, page_index) => page_index + 1);
  }

  const visible_pages = new Set([1, page_count]);
  for (let page_offset = -1; page_offset <= 1; page_offset += 1) {
    const page_number = current_page + page_offset;
    if (page_number > 1 && page_number < page_count) {
      visible_pages.add(page_number);
    }
  }

  const sorted_pages = [...visible_pages].sort((first_page, second_page) => first_page - second_page);
  const page_entries = [];

  sorted_pages.forEach((page_number, page_index) => {
    const previous_page = sorted_pages[page_index - 1];
    if (previous_page && page_number - previous_page > 1) {
      page_entries.push("ellipsis");
    }
    page_entries.push(page_number);
  });

  return page_entries;
}

function page_item_markup(page_entry, current_page) {
  if (page_entry === "ellipsis") {
    return render_template(page_template, {
      page_item_class: "pagination__item--page",
      page_content: '<span class="pagination__ellipsis" aria-hidden="true">&hellip;</span>',
    });
  }

  const page_content = page_entry === current_page
    ? `<span class="pagination__current" aria-current="page"><span class="visually-hidden">Current page</span> ${page_entry}</span>`
    : `<a class="pagination__link" href="#page-${page_entry}" aria-label="Go to page ${page_entry}">${page_entry}</a>`;

  return render_template(page_template, {
    page_item_class: "pagination__item--page",
    page_content,
  });
}

function control_markup(control_direction, target_page, is_disabled) {
  const is_previous = control_direction === "previous";
  return render_template(control_template, {
    control_tag: is_disabled ? "span" : "a",
    control_class: is_disabled ? "pagination__control--disabled" : "",
    control_attributes: is_disabled
      ? ' aria-disabled="true"'
      : ` href="#page-${target_page}" aria-label="Go to ${control_direction} page"`,
    arrow_symbol: is_previous ? "&larr;" : "&rarr;",
    control_label: is_previous ? "Previous" : "Next",
  });
}

export function pagination_markup({ current_page, page_count }) {
  const safe_page_count = Math.max(1, Math.min(99, Number(page_count) || 1));
  const safe_current_page = Math.max(1, Math.min(safe_page_count, Number(current_page) || 1));
  const page_items = pagination_entries(safe_current_page, safe_page_count)
    .map((page_entry) => page_item_markup(page_entry, safe_current_page))
    .join("");

  return render_template(pagination_template, {
    previous_control: control_markup("previous", safe_current_page - 1, safe_current_page === 1),
    page_items,
    current_page: escape_html(safe_current_page),
    page_count: escape_html(safe_page_count),
    next_control: control_markup("next", safe_current_page + 1, safe_current_page === safe_page_count),
  });
}
