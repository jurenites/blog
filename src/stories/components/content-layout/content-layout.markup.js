import content_layout_template from "./content-layout.template.html?raw";
import { escape_html, render_template } from "../../template.js";

export function content_layout_markup({ content_width, page_heading, introductory_text, show_sidebar }) {
  const sidebar_markup = show_sidebar
    ? '<aside class="content-layout__sidebar" aria-label="Related information"><h2 class="content-layout__sidebar-title">On this page</h2><ul class="content-layout__sidebar-list"><li>Introduction</li><li>Design decisions</li><li>Next steps</li></ul></aside>'
    : "";

  return render_template(content_layout_template, {
    content_width: escape_html(content_width),
    eyebrow_heading: "Layout component",
    introductory_text: escape_html(introductory_text),
    page_heading: escape_html(page_heading),
    primary_paragraph: "The layout owns content width and spacing while the components placed inside it retain their own markup and behavior.",
    secondary_paragraph: "Drupal page and node templates can apply these classes without requiring separate visual stories for every empty page shell.",
    section_heading: "A shared content frame",
    sidebar_class_name: show_sidebar ? " content-layout--with-sidebar" : "",
    sidebar_markup,
  });
}
