<?php

/**
 * @file
 * Local Drupal integration checks; restores edited content in finally.
 * docker exec blog_jurenites_web vendor/bin/drush php:script tests/footer-menu.php
 */

use Drupal\node\Entity\Node;

function footer_assert_check(bool $test_condition, string $test_message): void {
  if (!$test_condition) {
    throw new RuntimeException($test_message);
  }
}

function footer_page_xpath(string $page_path = '/'): DOMXPath {
  $request_context = stream_context_create(['http' => ['header' => "Host: jurenites.local\r\n"]]);
  $page_html = file_get_contents('http://127.0.0.1' . $page_path, FALSE, $request_context);
  $document_html = new DOMDocument();
  @$document_html->loadHTML('<?xml encoding="UTF-8">' . $page_html);
  // Simulate a new editor request between saves: Drupal coalesces tag
  // invalidations within one PHP request, while these assertions fetch HTTP.
  \Drupal::service('cache_tags.invalidator.checksum')->reset();
  return new DOMXPath($document_html);
}

$menu_storage = \Drupal::entityTypeManager()->getStorage('menu_link_content');
$menu_entities = $menu_storage->loadByProperties(['menu_name' => 'footer']);
$column_entities = array_values(array_filter($menu_entities, static fn($menu_entity) => $menu_entity->get('field_footer_role')->value === 'column'));
$badge_entities = array_values(array_filter($menu_entities, static fn($menu_entity) => !$menu_entity->get('field_footer_tag')->isEmpty()));
footer_assert_check(count($column_entities) === 4, 'Expected four editable columns.');
footer_assert_check(count($badge_entities) > 0, 'Expected a configured tag counter.');
$first_column = $column_entities[0];
$column_values = $first_column->toArray();
$russian_title = $first_column->getTranslation('ru')->label();
$badge_entity = $badge_entities[0];
$badge_values = $badge_entity->toArray();
$badge_term = $badge_entity->get('field_footer_tag')->entity;
$badge_slug = \Drupal::service('jurenites_blog.tag_slug_resolver')->slugify($badge_term->getUntranslated()->label());
$badge_path = '//div[@class="footer-navigation"]//a[contains(@href,"tag=' . $badge_slug . '")]';
$initial_xpath = footer_page_xpath();
$badge_count_path = $badge_path . '//*[contains(@class,"badge--numeric")]';
$original_count = (int) trim($initial_xpath->query($badge_count_path)->item(0)->textContent);
$paint_entities = array_values(array_filter($menu_entities, static fn($menu_entity) => !$menu_entity->get('field_footer_hover_paint')->isEmpty()));
$paint_entity = $paint_entities[0];
$original_paint = $paint_entity->get('field_footer_hover_paint')->value;
$test_project = NULL;
try {
  $test_paint = 'linear-gradient(315deg, var(--color-palette-brand-primary), var(--color-palette-brand-tertiary))';
  $paint_entity->set('field_footer_hover_paint', $test_paint)->save();
  footer_assert_check(footer_page_xpath()->query('//head/style[contains(., "--footer-hover-gradient:' . $test_paint . '")]')->length === 1, 'Changed brand paint must be attached to the initial page head and invalidate cached pages.');
  $first_column->set('title', 'Footer integration heading');
  $first_column->getTranslation('ru')->set('title', 'Тестовый заголовок футера');
  $first_column->save();
  footer_assert_check(footer_page_xpath()->query('//h2[normalize-space(.)="Footer integration heading"]')->length === 1, 'English heading edit must invalidate cache.');
  footer_assert_check(footer_page_xpath('/ru')->query('//h2[normalize-space(.)="Тестовый заголовок футера"]')->length === 1, 'Russian heading translation must render independently.');
  $badge_entity->set('parent', $first_column->getPluginId())->save();
  footer_assert_check(footer_page_xpath()->query('//nav[@aria-label="Footer integration heading"]//a[contains(@href,"tag=' . $badge_slug . '")]')->length === 1, 'Reparenting must move the counter.');
  $test_project = Node::create(['type' => 'project', 'title' => 'Footer counter integration fixture', 'langcode' => 'en', 'status' => 1, 'uid' => 1, 'field_tags' => [['target_id' => $badge_term->id()]]]);
  $test_project->addTranslation('ru', ['title' => 'Тест счётчика футера']);
  $test_project->save();
  footer_assert_check((int) trim(footer_page_xpath()->query($badge_count_path)->item(0)->textContent) === $original_count + 1, 'Count must update and count a translated Project only once.');
  $test_project->setUnpublished()->save();
  $test_project->getTranslation('ru')->setUnpublished()->save();
  footer_assert_check((int) trim(footer_page_xpath()->query($badge_count_path)->item(0)->textContent) === $original_count, 'Unpublished Projects must not be counted.');
  $other_terms = \Drupal::entityTypeManager()->getStorage('taxonomy_term')->loadByProperties(['vid' => 'tags']);
  foreach ($other_terms as $other_term) {
    if ($other_term->id() !== $badge_term->id()) {
      $other_slug = \Drupal::service('jurenites_blog.tag_slug_resolver')->slugify($other_term->getUntranslated()->label());
      $badge_entity->set('field_footer_tag', $other_term->id())->save();
      footer_assert_check(footer_page_xpath()->query('//div[@class="footer-navigation"]//a[contains(@href,"tag=' . $other_slug . '")]//*[contains(@class,"badge--numeric")]')->length === 1, 'A different selected Tag must drive the filter URL and badge.');
      break;
    }
  }
  footer_assert_check(!$badge_entity->access('update', new \Drupal\Core\Session\AnonymousUserSession()), 'Anonymous visitors must not be able to edit menu content.');
  $badge_entity->set('field_footer_tag', NULL)->save();
  footer_assert_check(footer_page_xpath()->query($badge_count_path)->length === 0, 'Clearing the tag field must remove the badge, even on the Fonts URL.');
  $badge_entity->set('enabled', FALSE)->save();
  footer_assert_check(footer_page_xpath()->query($badge_path)->length === 0, 'Disabled menu links must disappear without clearing cache.');
  echo "PASS: translated headings, reparenting, cache invalidation, distinct Project counts, unpublished exclusion, optional badge, disabled links.\n";
}
finally {
  $paint_entity->set('field_footer_hover_paint', $original_paint)->save();
  if ($test_project) {
    $test_project->delete();
  }
  $first_column->set('title', $column_values['title'][0]['value']);
  $first_column->getTranslation('ru')->set('title', $russian_title);
  $first_column->save();
  foreach (['parent', 'field_footer_tag', 'enabled'] as $field_name) {
    $badge_entity->set($field_name, $badge_values[$field_name]);
  }
  $badge_entity->save();
}
