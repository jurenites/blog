import guideline_detail_template from "./guideline-detail.template.html?raw";
import guideline_color_swatch_template from "./guideline-color-swatch.template.html?raw";
import { escape_html, render_template } from "../../template.js";
import { token_names, token_value } from "../../foundations/token-values.js";

function token_display_label(token_name) {
  return token_name
    .replace("color-palette-", "")
    .replace(/^(brand|system)-/, "")
    .split("-")
    .map((label_word) => `${label_word.charAt(0).toUpperCase()}${label_word.slice(1)}`)
    .join(" ");
}

function color_swatch_markup(token_name) {
  return render_template(guideline_color_swatch_template, {
    background_class: escape_html(`u-bg-${token_name}`),
    token_label: escape_html(token_display_label(token_name)),
    token_value: escape_html(token_value(token_name)),
    token_name: escape_html(token_name),
  });
}

function color_group_markup(group_label, color_tokens) {
  return `
    <section class="guideline-color-palette__group">
      <h3 class="guideline-color-palette__group-title">${escape_html(group_label)}</h3>
      <div class="guideline-color-palette__grid">${color_tokens.map(color_swatch_markup).join("")}</div>
    </section>
  `;
}

function guideline_color_specimen_markup() {
  const palette_tokens = token_names("color-palette-");
  const foundation_tokens = palette_tokens.filter((token_name) => !token_name.includes("-brand-") && !token_name.includes("-system-"));
  const brand_tokens = palette_tokens.filter((token_name) => token_name.includes("-brand-"));
  const system_tokens = palette_tokens.filter((token_name) => token_name.includes("-system-"));

  return `
    <section class="guideline-specimen guideline-color-palette">
      <header class="guideline-specimen__header">
        <h2 class="guideline-specimen__title">Token palette</h2>
        <p class="guideline-specimen__description">These values are read from the generated record of src/token/tokens.yaml.</p>
      </header>
      ${color_group_markup("Foundation", foundation_tokens)}
      ${color_group_markup("Brand", brand_tokens)}
      ${color_group_markup("System", system_tokens)}
    </section>
  `;
}

function guideline_logo_specimen_markup(logo_icon_url) {
  const safe_logo_url = escape_html(logo_icon_url);

  return `
    <section class="guideline-specimen guideline-logo-specimen">
      <header class="guideline-specimen__header">
        <h2 class="guideline-specimen__title">Current icon</h2>
        <p class="guideline-specimen__description">The rendered examples below use the same SVG file as the website header.</p>
      </header>
      <div class="guideline-logo-specimen__grid">
        <figure class="guideline-logo-specimen__surface guideline-logo-specimen__surface--dark">
          <img class="guideline-logo-specimen__image" src="${safe_logo_url}" alt="Jurenites pixel wordmark icon" />
          <figcaption>Dark surface</figcaption>
        </figure>
        <figure class="guideline-logo-specimen__surface guideline-logo-specimen__surface--light">
          <img class="guideline-logo-specimen__image" src="${safe_logo_url}" alt="Jurenites pixel wordmark icon" />
          <figcaption>Light surface</figcaption>
        </figure>
      </div>
      <p class="guideline-logo-specimen__source"><span>Source asset</span><code>web/themes/custom/jurenites_theme/logo.svg</code></p>
    </section>
  `;
}

export function guideline_detail_markup({
  guideline_summary,
  guideline_body,
  preview_kind,
  logo_icon_url,
}) {
  const resolved_preview_kind = preview_kind === "color" ? "color" : "logo-icon";
  const specimen_content = resolved_preview_kind === "color"
    ? guideline_color_specimen_markup()
    : guideline_logo_specimen_markup(logo_icon_url);

  return render_template(guideline_detail_template, {
    guideline_summary: escape_html(guideline_summary),
    guideline_body,
    preview_kind: resolved_preview_kind,
    specimen_content,
  });
}
