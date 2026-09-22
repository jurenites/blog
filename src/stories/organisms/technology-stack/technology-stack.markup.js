import stack_template from './technology-stack.template.html?raw';
import { escape_html, render_template } from '../../template.js';

function technology_item_markup(technology_data) {
  const asset_directory = '/assets/images/technology-stack/';
  const logo_content = technology_data.logo_file
    ? `<img class="technology-stack__logo technology-stack__logo--white" src="${asset_directory}${escape_html(technology_data.white_logo_file || technology_data.logo_file)}" alt="" loading="lazy" decoding="async">
       <img class="technology-stack__logo technology-stack__logo--color" src="${asset_directory}${escape_html(technology_data.logo_file)}" alt="" loading="lazy" decoding="async">`
    : `<span class="technology-stack__text-mark">${escape_html(technology_data.text_mark)}</span>`;
  return `<li class="technology-stack__item">
    <a class="technology-stack__link${technology_data.monochrome_brand ? ' technology-stack__link--monochrome' : ''}" href="${escape_html(technology_data.official_url)}" rel="external">
      <span class="technology-stack__artwork" aria-hidden="true">${logo_content}</span>
      <span class="technology-stack__name">${escape_html(technology_data.technology_name)}</span>
    </a>
  </li>`;
}

export function technology_stack_markup({ section_heading, technology_categories = [] }) {
  const category_content = technology_categories.map((category_data) => {
    const group_content = category_data.technology_groups.map((group_data) => `<div class="technology-stack__group">
      ${group_data.group_name ? `<h4 class="technology-stack__group-heading">${escape_html(group_data.group_name)}</h4>` : ''}
      <ul class="technology-stack__grid">${group_data.technology_items.map(technology_item_markup).join('')}</ul>
    </div>`).join('');
    return `<section class="technology-stack__category" aria-label="${escape_html(category_data.category_name)}">
      <h3 class="technology-stack__category-heading">${escape_html(category_data.category_name)}</h3>
      <div class="technology-stack__groups">${group_content}</div>
    </section>`;
  }).join('');
  return category_content ? render_template(stack_template, { section_heading: escape_html(section_heading), category_content }) : '';
}
