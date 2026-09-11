import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const DRUPAL_FOOTER_TEMPLATE_SOURCE = readFileSync(
  "web/themes/custom/jurenites_theme/templates/navigation/menu--footer.html.twig",
  "utf8",
);
const FOOTER_ITEM_TEMPLATE_SOURCE = readFileSync(
  "src/stories/organisms/footer-navigation/footer-navigation-item.template.html",
  "utf8",
);
const FOOTER_MARKUP_SOURCE = readFileSync(
  "src/stories/organisms/footer-navigation/footer-navigation.markup.js",
  "utf8",
);
const FOOTER_STORY_SOURCE = readFileSync(
  "src/stories/organisms/footer-navigation/footer-navigation.stories.js",
  "utf8",
);
const FOOTER_STYLES_SOURCE = readFileSync(
  "src/slice/src/scss/organisms/_footer-navigation.scss",
  "utf8",
);
const SOCIAL_PROFILES = JSON.parse(readFileSync(
  "web/themes/custom/jurenites_theme/social-links.json",
  "utf8",
));

const EXPECTED_SOCIAL_PROFILES = [
  ["LinkedIn", "alexanderilivanov", "https://www.linkedin.com/in/alexanderilivanov"],
  ["Facebook", "sasha.ilivanov", "https://www.facebook.com/sasha.ilivanov"],
  ["VKontakte", "user_ytko", "https://vk.com/user_ytko"],
  ["YouTube", "@jurenites", "https://www.youtube.com/@jurenites"],
  ["SoundCloud", "alexander-ilivanov", "https://soundcloud.com/alexander-ilivanov"],
  ["Steam", "jurenites", "https://steamcommunity.com/id/jurenites"],
];

test("social profiles declare the requested hover labels and destinations", () => {
  assert.deepEqual(
    SOCIAL_PROFILES.map(({ link_label, hover_label, link_url }) => [
      link_label,
      hover_label,
      link_url,
    ]),
    EXPECTED_SOCIAL_PROFILES,
  );
});

test("Drupal and Storybook expose the same accessible label-swap contract", () => {
  for (const template_source of [DRUPAL_FOOTER_TEMPLATE_SOURCE, FOOTER_ITEM_TEMPLATE_SOURCE]) {
    assert.match(template_source, /aria-label=/);
    assert.match(template_source, /footer-navigation__social-label-text--default/);
    assert.match(template_source, /footer-navigation__social-label-text--hover/);
  }

  for (const link_source of [DRUPAL_FOOTER_TEMPLATE_SOURCE, FOOTER_MARKUP_SOURCE]) {
    assert.match(link_source, /target="_blank"/);
    assert.match(link_source, /rel="me noopener noreferrer"/);
    assert.match(link_source, /mailto:/);
  }
  assert.match(FOOTER_ITEM_TEMPLATE_SOURCE, /\{\{link_target_attributes\}\}/);

  assert.match(DRUPAL_FOOTER_TEMPLATE_SOURCE, /icon_name: 'external-link'/);
  assert.match(DRUPAL_FOOTER_TEMPLATE_SOURCE, /icon_class: 'footer-navigation__external-mark'/);
  assert.match(DRUPAL_FOOTER_TEMPLATE_SOURCE, /icon_class: 'footer-navigation__social-network-icon'/);
  assert.match(FOOTER_ITEM_TEMPLATE_SOURCE, /\{\{external_icon_markup\}\}/);
  assert.match(FOOTER_MARKUP_SOURCE, /icon_name: "external-link"/);
  assert.match(FOOTER_MARKUP_SOURCE, /class_name: "footer-navigation__external-mark"/);
  assert.match(FOOTER_MARKUP_SOURCE, /class_name: "footer-navigation__social-network-icon"/);
  assert.match(FOOTER_STYLES_SOURCE, /\.footer-navigation__social-network-icon\s*\{/);
  assert.doesNotMatch(FOOTER_STYLES_SOURCE, /footer-navigation__social-link[\s\S]*?\.icon\s*\{/);
  assert.match(FOOTER_STYLES_SOURCE, /&:hover,\s*&:focus-visible/);
  assert.match(FOOTER_STYLES_SOURCE, /footer-navigation__social-label-text--hover/);
});

test("Footer Navigation story keeps Timeline at the bottom of Information", () => {
  assert.match(FOOTER_STORY_SOURCE, /const TIMELINE_LABEL = "Timeline";/);
  assert.match(FOOTER_STORY_SOURCE, /const TIMELINE_URL = "\/timeline";/);
  assert.match(FOOTER_MARKUP_SOURCE, /timeline_label: escape_html\(timeline_label\)/);
});
