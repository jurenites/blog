import stack_template from './technology-stack.template.html?raw';
import { escape_html, render_template } from '../../template.js';
import { icon_markup } from '../../atoms/icon/icon.markup.js';

function technology_item_markup(technology_data, category_name, group_name) {
  const asset_directory = '/assets/images/technology-stack/';
  const logo_content = technology_data.logo_file
    ? `<img class="technology-stack__logo technology-stack__logo--white" src="${asset_directory}${escape_html(technology_data.white_logo_file || technology_data.logo_file)}" alt="" loading="lazy" decoding="async">
       <img class="technology-stack__logo technology-stack__logo--color" src="${asset_directory}${escape_html(technology_data.logo_file)}" alt="" loading="lazy" decoding="async">`
    : `<span class="technology-stack__text-mark">${escape_html(technology_data.text_mark)}</span>`;
  return `<li class="technology-stack__item">
    <div class="technology-stack__tile" tabindex="0" role="group" aria-label="${escape_html(technology_data.technology_name)}">
      <span class="technology-stack__artwork" aria-hidden="true">${logo_content}</span>
      <span class="tooltip technology-stack__tooltip">
        <span class="technology-stack__category-name">${escape_html(category_name)}${group_name ? ` / ${escape_html(group_name)}` : ''}</span>
        <a class="technology-stack__link" href="${escape_html(technology_data.official_url)}" rel="external"><span class="technology-stack__name">${escape_html(technology_data.technology_name)}${icon_markup({ icon_name: 'external-link', class_name: 'technology-stack__external-mark' })}</span></a>
      </span>
    </div>
  </li>`;
}

export function technology_stack_markup({ section_heading, technology_categories = [] }) {
  const technology_content = technology_categories.flatMap((category_data) =>
    category_data.technology_groups.flatMap((group_data) =>
      group_data.technology_items.map((technology_data) =>
        technology_item_markup(technology_data, category_data.category_name, group_data.group_name)))).join('');
  return technology_content ? render_template(stack_template, { section_heading: escape_html(section_heading), technology_content }) : '';
}
