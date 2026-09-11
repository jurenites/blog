import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const BADGE_TEMPLATE_SOURCE = readFileSync(
  "src/stories/atoms/badge/badge.template.html",
  "utf8",
);
const FOOTER_MARKUP_SOURCE = readFileSync(
  "src/stories/organisms/footer-navigation/footer-navigation.markup.js",
  "utf8",
);
const FOOTER_TEMPLATE_SOURCE = readFileSync(
  "src/stories/organisms/footer-navigation/footer-navigation.template.html",
  "utf8",
);
const FOOTER_STYLES_SOURCE = readFileSync(
  "src/slice/src/scss/organisms/_footer-navigation.scss",
  "utf8",
);
const PORTFOLIO_VIEW_SOURCE = readFileSync(
  "web/modules/custom/jurenites_font_projects/config/install/views.view.portfolio.yml",
  "utf8",
);
const PROJECT_MODULE_SOURCE = readFileSync(
  "web/modules/custom/jurenites_font_projects/jurenites_font_projects.module",
  "utf8",
);
const PORTFOLIO_TEMPLATE_SOURCE = readFileSync(
  "web/themes/custom/jurenites_theme/templates/views/views-view--portfolio--page-1.html.twig",
  "utf8",
);
const THEME_SOURCE = readFileSync(
  "web/themes/custom/jurenites_theme/jurenites_theme.theme",
  "utf8",
);
const MAIN_MENU_TEMPLATE_SOURCE = readFileSync(
  "web/themes/custom/jurenites_theme/templates/navigation/menu--main.html.twig",
  "utf8",
);
const GLOBAL_STYLES_SOURCE = readFileSync(
  "src/slice/src/scss/base/_global.scss",
  "utf8",
);
const SITE_HEADER_STYLES_SOURCE = readFileSync(
  "src/slice/src/scss/organisms/_site-header.scss",
  "utf8",
);
const SITE_HEADER_STORY_SOURCE = readFileSync(
  "src/stories/organisms/site-header/site-header.stories.js",
  "utf8",
);
const SITE_HEADER_MARKUP_SOURCE = readFileSync(
  "src/stories/organisms/site-header/site-header.markup.js",
  "utf8",
);
const SITE_HEADER_TEMPLATE_SOURCE = readFileSync(
  "src/stories/organisms/site-header/site-header.template.html",
  "utf8",
);
const SITE_BRANDING_TEMPLATE_SOURCE = readFileSync(
  "web/themes/custom/jurenites_theme/templates/block/block--jurenites-theme-site-branding.html.twig",
  "utf8",
);
const DESIGN_TOKEN_SOURCE = readFileSync("src/token/tokens.yaml", "utf8");

test("Footer Navigation composes the shared gray Badge for the font count", () => {
  assert.match(FOOTER_MARKUP_SOURCE, /import \{ badge_markup \}/);
  assert.match(FOOTER_MARKUP_SOURCE, /color_variant: "gray"/);
  assert.match(FOOTER_MARKUP_SOURCE, /fonts_badge_markup/);
  assert.match(FOOTER_TEMPLATE_SOURCE, /href="\{\{fonts_url\}\}"/);
  assert.match(FOOTER_TEMPLATE_SOURCE, /\{\{fonts_badge_markup\}\}/);
  assert.match(FOOTER_TEMPLATE_SOURCE, /footer-navigation__link--with-badge/);
  assert.match(FOOTER_TEMPLATE_SOURCE, /footer-navigation__link-label/);
  assert.match(FOOTER_STYLES_SOURCE, /footer-navigation__link--with-badge/);
  assert.match(FOOTER_STYLES_SOURCE, /footer-navigation__link-label/);
  assert.match(BADGE_TEMPLATE_SOURCE, /class="\{\{badge_class_name\}\}"/);
});

test("Portfolio View resolves the readable tag argument and fails invalid terms closed", () => {
  assert.match(PORTFOLIO_VIEW_SOURCE, /default_argument_type: jurenites_tag_slug/);
  assert.match(PORTFOLIO_VIEW_SOURCE, /fail: 'not found'/);
  assert.match(PORTFOLIO_VIEW_SOURCE, /- 'url\.query_args:tag'/);
});

test("Project assignments append the Font term and the count queries current published content", () => {
  assert.match(PROJECT_MODULE_SOURCE, /field_tags'\)->appendItem/);
  assert.match(PROJECT_MODULE_SOURCE, /condition\('status', NodeInterface::PUBLISHED\)/);
  assert.match(PROJECT_MODULE_SOURCE, /condition\('field_tags\.target_id', \$font_term->id\(\)\)/);
  assert.match(PROJECT_MODULE_SOURCE, /->count\(\)/);
  assert.match(PROJECT_MODULE_SOURCE, /getBundleListCacheTags\('project'\)/);
  assert.match(PROJECT_MODULE_SOURCE, /user\.node_grants:view/);
});

test("Footer item detection requires both Portfolio and the font tag query", () => {
  assert.match(PROJECT_MODULE_SOURCE, /\(\$item_query\['tag'\] \?\? NULL\) !== JURENITES_FONT_PROJECTS_FONT_TAG_SLUG/);
  assert.match(PROJECT_MODULE_SOURCE, /getInternalPath\(\) === 'portfolio'/);
});

test("Portfolio exposes every accessible published Project tag as a persistent Chip choice", () => {
  assert.match(THEME_SOURCE, /function jurenites_theme_add_portfolio_tag_options/);
  assert.match(THEME_SOURCE, /condition\('status', NodeInterface::PUBLISHED\)/);
  assert.match(THEME_SOURCE, /\$tag_term->access\('view', NULL, TRUE\)/);
  assert.match(THEME_SOURCE, /taxonomy_term_list:tags/);
  assert.match(PORTFOLIO_TEMPLATE_SOURCE, /for tag_option in portfolio_tag_options/);
  assert.match(PORTFOLIO_TEMPLATE_SOURCE, /aria-current="true"/);
  assert.match(PORTFOLIO_TEMPLATE_SOURCE, /chip--accent/);
  assert.doesNotMatch(PORTFOLIO_TEMPLATE_SOURCE, /cross-big/);
});

test("Main navigation uses Drupal's route active trail instead of an exact query-string match", () => {
  assert.match(MAIN_MENU_TEMPLATE_SOURCE, /menu_item\.in_active_trail/);
  assert.match(MAIN_MENU_TEMPLATE_SOURCE, /'aria-current': 'page'/);
  assert.match(MAIN_MENU_TEMPLATE_SOURCE, /\['site-header__link', 'is-active'\]/);
});

test("Global link defaults leave main navigation active colors to the header", () => {
  assert.match(GLOBAL_STYLES_SOURCE, /a:not\(\.button\):not\(\.site-header__link\)/);
});

test("Brand hover uses the same elevated header surface as menu items", () => {
  assert.match(SITE_HEADER_STYLES_SOURCE, /&__brand[\s\S]*?&:hover,[\s\S]*?&:focus-visible[\s\S]*?background-color: var\(--theme-dark-surface-background-elevation-level-1\)/);
});

test("Brand initials expand into separate names without moving navigation", () => {
  assert.match(SITE_HEADER_STORY_SOURCE, /const BRAND_FULL_NAME = "Alexander Ilivanov"/);
  assert.doesNotMatch(SITE_HEADER_STORY_SOURCE, /BRAND_SHORT_NAME/);
  assert.match(SITE_HEADER_MARKUP_SOURCE, /function brand_name_markup\(brand_full_name\)/);
  assert.match(SITE_HEADER_MARKUP_SOURCE, /site-header__brand-name-letter/);
  assert.match(SITE_HEADER_TEMPLATE_SOURCE, /site-header__brand-name-short">\{\{brand_name_markup\}\}/);
  assert.doesNotMatch(SITE_HEADER_TEMPLATE_SOURCE, /site-header__brand-name-full/);
  assert.match(SITE_BRANDING_TEMPLATE_SOURCE, /site-header__brand-name-initial">A</);
  assert.match(SITE_BRANDING_TEMPLATE_SOURCE, /site-header__brand-name-initial">I</);
  assert.match(SITE_BRANDING_TEMPLATE_SOURCE, /site-header__brand-name-word--first/);
  assert.match(SITE_BRANDING_TEMPLATE_SOURCE, /site-header__brand-name-word--last/);
  assert.match(SITE_BRANDING_TEMPLATE_SOURCE, /aria-label="\{\{ 'Alexander Ilivanov — home'\|t \}\}"/);
  assert.match(SITE_HEADER_STYLES_SOURCE, /&__brand-name[\s\S]*?inline-size: var\(--component-site-header-brand-name-compact-width-default\)/);
  assert.match(SITE_HEADER_STYLES_SOURCE, /&__brand-name-short[\s\S]*?position: absolute/);
  assert.match(SITE_HEADER_STYLES_SOURCE, /&__brand:hover &__brand-name-letter[\s\S]*?max-inline-size: 2ch/);
  assert.match(SITE_HEADER_STYLES_SOURCE, /transition-delay: var\(--component-site-header-brand-name-hold-duration-default\)/);
  assert.match(DESIGN_TOKEN_SOURCE, /brand-name-hold-duration-default: 2000ms/);
});
