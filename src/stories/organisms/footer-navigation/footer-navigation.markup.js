import "./footer-navigation.demo.css";
import { escape_html, render_template } from "../../template.js";
import { badge_markup } from "../../atoms/badge/badge.markup.js";
import { icon_markup } from "../../atoms/icon/icon.markup.js";
import { pulse_indicator_markup } from "../../atoms/pulse-indicator/pulse-indicator.markup.js";
import footer_navigation_template from "./footer-navigation.template.html?raw";
import footer_navigation_item_template from "./footer-navigation-item.template.html?raw";

function recruiter_item_markup(recruiter_link) {
  if (recruiter_link.item_role === "section") {
    const prefix_markup = recruiter_link.icon_name === "pulse-indicator"
      ? `<span class="footer-navigation__pulse-prefix">${pulse_indicator_markup()}</span>`
      : "";
    return `<li class="footer-navigation__item footer-navigation__section"><h3 class="footer-navigation__heading${prefix_markup ? " footer-navigation__heading--with-prefix" : ""}">${prefix_markup}<span>${escape_html(recruiter_link.link_label)}</span></h3><ul class="footer-navigation__list">${(recruiter_link.child_links || []).map(recruiter_item_markup).join("")}</ul></li>`;
  }
  return `<li class="footer-navigation__item"><a class="footer-navigation__link" href="${escape_html(recruiter_link.link_url)}" target="_blank" rel="noopener noreferrer" aria-label="${escape_html(recruiter_link.link_label)} (opens in a new window)">${recruiter_link.icon_name ? icon_markup({ icon_name: recruiter_link.icon_name, class_name: "footer-navigation__social-network-icon", is_link_prefix: true }) : ""}<span class="footer-navigation__link-label">${escape_html(recruiter_link.link_label)}</span></a></li>`;
}

export function footer_navigation_markup({
  recruiter_heading,
  section_description = "",
  recruiter_links = [],
  social_heading,
  messengers_heading,
  information_heading,
  how_i_work_heading,
  how_i_work_links,
  guideline_label,
  guideline_url,
  guideline_active_state = "",
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
    numeric_style: true,
    color_variant: "gray",
  });

  return render_template(footer_navigation_template, {
    recruiter_heading: escape_html(recruiter_heading),
    section_description_markup: section_description ? `<p class="footer-navigation__section-description">${escape_html(section_description)}</p>` : "",
    recruiter_links_markup: recruiter_links.map(recruiter_item_markup).join(""),
    social_heading: escape_html(social_heading),
    messengers_heading: escape_html(messengers_heading),
    information_heading: escape_html(information_heading),
    how_i_work_heading: escape_html(how_i_work_heading),
    guideline_label: escape_html(guideline_label),
    guideline_url: escape_html(guideline_url),
    guideline_active_class: guideline_active_state ? " is-active" : "",
    guideline_current_attribute: ["page", "location"].includes(guideline_active_state)
      ? `aria-current="${guideline_active_state}"`
      : "",
    messenger_links_markup: messenger_links.map((messenger_link) => render_template(footer_navigation_item_template, {
      link_target_attributes: messenger_link.link_url.startsWith("mailto:") ? "" : 'target="_blank" rel="me noopener noreferrer"',
      external_icon_markup: messenger_link.link_url.startsWith("mailto:") ? "" : icon_markup({
        icon_name: "external-link",
        class_name: "footer-navigation__external-mark",
      }),
      hover_label: escape_html(messenger_link.hover_label),
      hover_label_markup: escape_html(messenger_link.hover_label),
      link_label: escape_html(messenger_link.link_label),
      link_accessible_label: escape_html(`${messenger_link.link_label}: ${messenger_link.hover_label} (${messenger_link.link_url.startsWith("mailto:") ? "opens your email app" : "opens in a new window"})`),
      link_url: escape_html(messenger_link.link_url),
      icon_name: escape_html(`messenger-${messenger_link.icon_name}`),
      social_icon_markup: icon_markup({
        icon_name: messenger_link.icon_name,
        class_name: "footer-navigation__social-network-icon", is_link_prefix: true,
      }),
      resource_link_class: "footer-navigation__messenger-link",
    })).join(""),
    how_i_work_links_markup: how_i_work_links.map((resource_link) => render_template(footer_navigation_item_template, {
      link_target_attributes: 'target="_blank" rel="me noopener noreferrer"',
      external_icon_markup: icon_markup({
        icon_name: "external-link",
        class_name: "footer-navigation__external-mark",
      }),
      hover_label: escape_html(resource_link.hover_label),
      hover_label_markup: escape_html(resource_link.hover_label),
      link_label: escape_html(resource_link.link_label),
      link_accessible_label: escape_html(`${resource_link.link_label}: ${resource_link.hover_label} (opens in a new window)`),
      link_url: escape_html(resource_link.link_url),
      icon_name: escape_html(resource_link.icon_name),
      social_icon_markup: icon_markup({
        icon_name: resource_link.icon_name,
        class_name: "footer-navigation__resource-icon", is_link_prefix: true,
      }),
      resource_link_class: `footer-navigation__resource-link${resource_link.icon_variant ? ` footer-navigation__resource-link--${resource_link.icon_variant}` : ""}`,
    })).join(""),
    social_links_markup: social_links.map((social_link) => render_template(footer_navigation_item_template, {
      link_target_attributes: 'target="_blank" rel="me noopener noreferrer"',
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
        class_name: "footer-navigation__social-network-icon", is_link_prefix: true,
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
