import { escape_html, render_template } from "../../template.js";
import { badge_markup } from "../../atoms/badge/badge.markup.js";
import { icon_markup } from "../../atoms/icon/icon.markup.js";
import footer_navigation_template from "./footer-navigation.template.html?raw";
import footer_navigation_item_template from "./footer-navigation-item.template.html?raw";

export function footer_navigation_markup({
  social_heading,
  messengers_heading,
  information_heading,
  how_i_work_heading,
  how_i_work_links,
  messenger_links,
  social_links,
  privacy_policy_label,
  privacy_policy_url,
  fonts_label,
  fonts_url,
  font_project_count,
  timeline_label,
  timeline_url,
  rights_message,
  current_year,
}) {
  const fonts_badge_markup = badge_markup({
    badge_label: font_project_count,
    color_variant: "gray",
  });

  return render_template(footer_navigation_template, {
    social_heading: escape_html(social_heading),
    messengers_heading: escape_html(messengers_heading),
    information_heading: escape_html(information_heading),
    how_i_work_heading: escape_html(how_i_work_heading),
    messenger_links_markup: messenger_links.map((messenger_link) => render_template(footer_navigation_item_template, {
      external_icon_markup: icon_markup({
        icon_name: "external-link",
        class_name: "footer-navigation__external-mark",
      }),
      hover_label: escape_html(messenger_link.hover_label),
      hover_label_markup: escape_html(messenger_link.hover_label),
      link_label: escape_html(messenger_link.link_label),
      link_accessible_label: escape_html(`${messenger_link.link_label}: ${messenger_link.hover_label} (opens in a new window)`),
      link_url: escape_html(messenger_link.link_url),
      icon_name: escape_html(messenger_link.icon_name),
      social_icon_markup: icon_markup({
        icon_name: messenger_link.icon_name,
        class_name: "footer-navigation__social-network-icon",
      }),
      resource_link_class: "footer-navigation__messenger-link",
    })).join(""),
    how_i_work_links_markup: how_i_work_links.map((resource_link) => render_template(footer_navigation_item_template, {
      external_icon_markup: icon_markup({
        icon_name: "external-link",
        class_name: "footer-navigation__external-mark",
      }),
      hover_label: escape_html(resource_link.hover_label),
      hover_label_markup: resource_link.hover_parts
        ? resource_link.hover_parts.map((hover_part) => `<span class="footer-navigation__resource-label-part${hover_part.color_token ? ` footer-navigation__resource-label-part--${escape_html(hover_part.color_token)}` : ""}">${escape_html(hover_part.text)}</span>`).join("")
        : escape_html(resource_link.hover_label),
      link_label: escape_html(resource_link.link_label),
      link_accessible_label: escape_html(`${resource_link.link_label}: ${resource_link.hover_label} (opens in a new window)`),
      link_url: escape_html(resource_link.link_url),
      icon_name: escape_html(resource_link.icon_name),
      social_icon_markup: icon_markup({
        icon_name: resource_link.icon_name,
        class_name: "footer-navigation__resource-icon",
      }),
      resource_link_class: `footer-navigation__resource-link${resource_link.color_token ? ` footer-navigation__resource-link--${resource_link.color_token}` : ""}`,
    })).join(""),
    social_links_markup: social_links.map((social_link) => render_template(footer_navigation_item_template, {
      external_icon_markup: icon_markup({
        icon_name: "external-link",
        class_name: "footer-navigation__external-mark",
      }),
      hover_label: escape_html(social_link.hover_label),
      hover_label_markup: escape_html(social_link.hover_label),
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
    timeline_label: escape_html(timeline_label),
    timeline_url: escape_html(timeline_url),
  });
}
