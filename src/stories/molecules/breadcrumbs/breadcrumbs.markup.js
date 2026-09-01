import breadcrumbs_template from "./breadcrumbs.template.html?raw";
import { icon_markup } from "../../atoms/icon/icon.markup.js";
import { escape_html, render_template } from "../../template.js";

function breadcrumb_link_markup(breadcrumb_name) {
  const breadcrumb_slug = breadcrumb_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  return `<li class="breadcrumbs__item"><a class="breadcrumbs__link" href="#${escape_html(breadcrumb_slug)}">${escape_html(breadcrumb_name)}</a></li>`;
}

function back_link_markup(back_link_url) {
  return `<a class="breadcrumbs__back-link" href="${escape_html(back_link_url)}" aria-label="Back to Blog" data-jurenites-article-back><span>Back</span>${icon_markup({ icon_name: "arrow-left", class_name: "breadcrumbs__back-icon" })}</a>`;
}

export function breadcrumbs_markup({
  ancestor_list,
  back_link_url,
  current_page,
  show_back_link = false,
}) {
  const ancestor_items = String(ancestor_list)
    .split(",")
    .map((ancestor_name) => ancestor_name.trim())
    .filter(Boolean)
    .map(breadcrumb_link_markup)
    .join("");
  const current_item = `<li class="breadcrumbs__item" aria-current="page"><span class="breadcrumbs__current">${escape_html(current_page)}</span></li>`;

  return render_template(breadcrumbs_template, {
    back_link: show_back_link ? back_link_markup(back_link_url) : "",
    breadcrumb_items: `${ancestor_items}${current_item}`,
  });
}
