import { escape_html, render_template } from "../../template.js";
import { badge_markup } from "../../atoms/badge/badge.markup.js";
import { icon_markup } from "../../atoms/icon/icon.markup.js";
import footer_navigation_template from "./footer-navigation.template.html?raw";
import footer_navigation_item_template from "./footer-navigation-item.template.html?raw";

export function footer_navigation_markup({
  social_heading,
  information_heading,
  social_links,
  privacy_policy_label,
  privacy_policy_url,
  fonts_label,
  fonts_url,
  font_project_count,
  rights_message,
  current_year,
}) {
  const fonts_badge_markup = badge_markup({
    badge_label: font_project_count,
    color_variant: "gray",
  });

  return render_template(footer_navigation_template, {
    social_heading: escape_html(social_heading),
    information_heading: escape_html(information_heading),
    social_links_markup: social_links.map((social_link) => render_template(footer_navigation_item_template, {
      external_icon_markup: icon_markup({
        icon_name: "external-link",
        class_name: "footer-navigation__external-mark",
      }),
      hover_label: escape_html(social_link.hover_label),
      link_label: escape_html(social_link.link_label),
      link_accessible_label: escape_html(`${social_link.link_label}: ${social_link.hover_label} (opens in a new window)`),
      link_url: escape_html(social_link.link_url),
      icon_name: escape_html(social_link.icon_name),
      social_icon_markup: icon_markup({
        icon_name: social_link.icon_name,
        class_name: "footer-navigation__social-network-icon",
      }),
    })).join(""),
    current_year: escape_html(current_year),
    fonts_badge_markup,
    fonts_label: escape_html(fonts_label),
    fonts_url: escape_html(fonts_url),
    privacy_policy_label: escape_html(privacy_policy_label),
    privacy_policy_url: escape_html(privacy_policy_url),
    rights_message: escape_html(rights_message),
  });
}
