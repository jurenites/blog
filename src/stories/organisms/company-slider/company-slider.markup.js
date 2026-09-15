import { escape_html } from '../../template.js';
import { icon_markup } from '../../atoms/icon/icon.markup.js';

export function company_slider_markup({ section_heading, company_items = [] }) {
  return `<section class="company-slider" data-company-slider aria-label="${escape_html(section_heading)}" aria-roledescription="carousel">
    <div class="company-slider__header"><h2 class="company-slider__heading">${escape_html(section_heading)}</h2>
      <div class="company-slider__controls" data-company-controls hidden>
        <button class="company-slider__control" type="button" data-company-previous aria-label="Previous companies">${icon_markup({ icon_name: 'arrow-left', class_name: 'company-slider__control-icon' })}</button>
        <button class="company-slider__control" type="button" data-company-next aria-label="Next companies">${icon_markup({ icon_name: 'arrow-left', class_name: 'company-slider__control-icon company-slider__control-icon--next' })}</button>
      </div>
    </div>
    <ul class="company-slider__track horizontal-scrollbar" data-company-track tabindex="0" aria-label="Companies. Use left and right arrow keys to scroll.">
      ${company_items.map((company_data) => `<li class="company-slider__item">
        <a id="company-${escape_html(company_data.company_key)}" class="company-slider__company-link" href="${escape_html(company_data.website_url)}" aria-label="${escape_html(company_data.company_name)}">
          <span class="company-slider__artwork"><img class="company-slider__logo company-slider__logo--${escape_html(company_data.company_key)}" src="/assets/images/companies/${escape_html(company_data.logo_asset_file || company_data.logo_file)}${company_data.logo_version ? `?v=${escape_html(company_data.logo_version)}` : ''}" alt="" loading="lazy" decoding="async"></span>
          <span class="company-slider__name">${escape_html(company_data.company_name)}</span>
        </a>
        <p class="company-slider__relationship">${escape_html(company_data.relationship_text)}</p>
        <a class="company-slider__projects" href="${escape_html(company_data.projects_url || '/timeline')}" aria-label="See the projects: ${escape_html(company_data.company_name)}">See the projects</a>
      </li>`).join('')}
    </ul>
  </section>`;
}
