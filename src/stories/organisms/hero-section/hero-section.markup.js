import hero_template from "./hero-section.template.html?raw";
import slide_template from "./hero-slide.template.html?raw";
import { button_link_markup } from "../../atoms/button/button.markup.js";
import { escape_html, render_template } from "../../template.js";

export function hero_section_markup({ section_label, eyebrow_heading, background_image_url, image_description, glow_enabled, hero_slides }) {
  const panel_markup = hero_slides.map((slide_content) => {
    const action_markup = [
      [slide_content.primary_label, slide_content.primary_url, "primary"],
      [slide_content.secondary_label, slide_content.secondary_url, "secondary"],
    ].filter(([button_label, link_url]) => button_label && link_url)
      .map(([button_label, link_url, style_variant]) => button_link_markup({
        button_label, link_url, style_variant, additional_class_names: "hero-section__action",
      })).join("");
    return render_template(slide_template, {
      slide_heading: escape_html(slide_content.slide_heading),
      description_markup: slide_content.slide_description
        ? `<p class="hero-section__description">${escape_html(slide_content.slide_description)}</p>` : "",
      actions_markup: action_markup ? `<div class="hero-section__actions">${action_markup}</div>` : "",
    });
  }).join("");
  return render_template(hero_template, {
    additional_classes: `${glow_enabled && background_image_url ? " hero-section--glow" : ""}${background_image_url ? "" : " hero-section--without-image"}`,
    section_label: escape_html(section_label),
    scene_markup: background_image_url
      ? `<div class="hero-section__scene"><img class="hero-section__image" src="${escape_html(background_image_url)}" alt="${escape_html(image_description)}" decoding="async"><div class="hero-section__glow" aria-hidden="true"><div class="hero-section__rays"></div></div></div>` : "",
    eyebrow_markup: eyebrow_heading ? `<p class="hero-section__eyebrow">${escape_html(eyebrow_heading)}</p>` : "",
    panel_markup,
    navigation_label: "Hero sections",
    navigation_markup: hero_slides.map((slide_content) => `<button class="hero-section__tab" type="button" data-hero-select>${escape_html(slide_content.navigation_label)}</button>`).join(""),
  });
}
