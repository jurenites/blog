import profile_template from "./skills-profile.template.html?raw";
import skill_template from "./skill-item.template.html?raw";
import { escape_html, render_template } from "../../template.js";

export function skills_profile_markup({ skill_items = [] }) {
  const visible_items = skill_items.filter((skill_item) => skill_item.technology_name);
  if (!visible_items.length) return "";
  const skill_content = visible_items.map((skill_item) => {
    const score_value = Number(skill_item.skill_score);
    const has_rating = skill_item.skill_score !== null && skill_item.skill_score !== undefined
      && String(skill_item.skill_score).trim() !== "" && Number.isFinite(score_value) && score_value >= 0 && score_value <= 5;
    const score_text = has_rating ? score_value.toFixed(1) : "";
    const score_content = has_rating
      ? `<p class="skills-profile__score" aria-label="${escape_html(skill_item.technology_name)}: ${score_text} out of 5">${score_text}<span class="skills-profile__score-total" aria-hidden="true"> / 5</span></p>`
      : '<p class="skills-profile__unrated">Not assessed</p>';
    return render_template(skill_template, {
      technology_name: escape_html(skill_item.technology_name),
      skill_category: escape_html(skill_item.skill_category),
      skill_description: escape_html(skill_item.skill_description),
      score_content,
    });
  }).join("");
  return render_template(profile_template, { skill_content });
}
