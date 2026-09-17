<?php

/**
 * @file
 * Imports a captured legacy footer once, preserving existing menu entities.
 * Capture EN/RU HTML before deploying the new template; keep it outside Git.
 * FOOTER_SNAPSHOT_PREFIX=/tmp/jurenites-footer-before drush php:script scripts/footer/migrate.php
 */

use Drupal\menu_link_content\Entity\MenuLinkContent;

if (\Drupal::state()->get('jurenites_footer.migrated')) {
  echo "Footer already migrated; editorial menu content was not changed.\n";
  return;
}
if (!\Drupal::moduleHandler()->moduleExists('jurenites_footer')) {
  throw new RuntimeException('Enable jurenites_footer first.');
}
$snapshot_prefix = getenv('FOOTER_SNAPSHOT_PREFIX');
if (!$snapshot_prefix) {
  throw new RuntimeException('Set FOOTER_SNAPSHOT_PREFIX to the captured HTML path prefix.');
}
$snapshot_trees = [];
foreach (['en', 'ru'] as $language_code) {
  $snapshot_html = file_get_contents($snapshot_prefix . '-' . $language_code . '.html');
  $document_html = new DOMDocument();
  @$document_html->loadHTML('<?xml encoding="UTF-8">' . $snapshot_html);
  $snapshot_trees[$language_code] = new DOMXPath($document_html);
  if ($snapshot_trees[$language_code]->query('//div[@class="footer-navigation__columns"]/nav')->length !== 4) {
    throw new RuntimeException('Expected four captured footer columns in ' . $language_code);
  }
}
$menu_storage = \Drupal::entityTypeManager()->getStorage('menu_link_content');
$existing_links = $menu_storage->loadByProperties(['menu_name' => 'footer']);
$english_language = \Drupal::languageManager()->getLanguage('en');
$existing_by_url = [];
foreach ($existing_links as $menu_entity) {
  $link_url = $menu_entity->getUrlObject()->setOption('language', $english_language)->toString();
  $existing_by_url[$link_url] = $menu_entity;
}
$database_transaction = \Drupal::database()->startTransaction();
try {
  $created_count = 0;
  $migrated_count = 0;
  $section_paths = ['//div[@class="footer-navigation__columns"]/nav', '//nav[contains(@class,"footer-navigation__legal-navigation")]'];
  foreach ($section_paths as $section_index => $section_path) {
    $english_sections = $snapshot_trees['en']->query($section_path);
    $russian_sections = $snapshot_trees['ru']->query($section_path);
    foreach ($english_sections as $column_index => $column_node) {
      $russian_column = $russian_sections->item($column_index);
      if (!$russian_column) {
        throw new RuntimeException('Missing corresponding Russian column.');
      }
      $column_entity = MenuLinkContent::create([
        'menu_name' => 'footer', 'langcode' => 'en', 'title' => $column_node->getAttribute('aria-label'),
        'link' => ['uri' => 'route:<nolink>'], 'enabled' => TRUE, 'expanded' => TRUE,
        'weight' => $section_index === 0 ? $column_index : 10 + $column_index,
        'field_footer_role' => $section_index === 0 ? 'column' : 'bottom',
      ]);
      $column_entity->addTranslation('ru', ['title' => $russian_column->getAttribute('aria-label')]);
      $column_entity->save();
      $created_count++;
      $english_links = $snapshot_trees['en']->query('.//a', $column_node);
      $russian_links = $snapshot_trees['ru']->query('.//a', $russian_column);
      if ($english_links->length !== $russian_links->length) {
        throw new RuntimeException('Language link counts differ; inspect the snapshot before migration.');
      }
      foreach ($english_links as $link_index => $link_node) {
        $link_href = $link_node->getAttribute('href');
        $russian_link = $russian_links->item($link_index);
        $label_path = './/*[contains(@class,"label-text--default") or contains(@class,"link-label")]';
        $link_label = trim(($snapshot_trees['en']->query($label_path, $link_node)->item(0) ?? $link_node)->textContent);
        $russian_label = trim(($snapshot_trees['ru']->query($label_path, $russian_link)->item(0) ?? $russian_link)->textContent);
        $menu_entity = $existing_by_url[$link_href] ?? NULL;
        if (!$menu_entity) {
          $menu_entity = MenuLinkContent::create([
            'menu_name' => 'footer', 'langcode' => 'en', 'title' => $link_label,
            'link' => ['uri' => str_starts_with($link_href, '/') ? 'internal:' . $link_href : $link_href],
            'enabled' => TRUE,
          ]);
          $created_count++;
        }
        if (!$menu_entity->hasTranslation('ru')) {
          $menu_entity->addTranslation('ru', ['title' => $russian_label]);
        }
        $menu_entity->set('parent', $column_entity->getPluginId());
        $menu_entity->set('weight', $link_index);
        $menu_entity->set('field_footer_role', 'link');
        $icon_node = $snapshot_trees['en']->query('.//icon[not(@name="external-link")]', $link_node)->item(0);
        $icon_name = $icon_node?->getAttribute('name') ?? '';
        $menu_entity->set('field_footer_icon', $icon_name ?: NULL);
        $color_name = preg_replace('/^(social-|brand-)/', '', $icon_name);
        $menu_entity->set('field_footer_hover_paint', \Drupal\jurenites_footer\HoverPaint::legacyValue($color_name));
        $menu_entity->set('field_footer_new_window', $link_node->getAttribute('target') === '_blank');
        foreach (['en' => $link_node, 'ru' => $russian_link] as $language_code => $translated_node) {
          $hover_node = $snapshot_trees[$language_code]->query('.//*[contains(@class,"label-text--hover")]', $translated_node)->item(0);
          $menu_entity->getTranslation($language_code)->set('field_footer_hover_text', $hover_node ? trim($hover_node->textContent) : NULL);
        }
        parse_str(parse_url($link_href, PHP_URL_QUERY) ?? '', $query_values);
        if (isset($query_values['tag']) && $snapshot_trees['en']->query('.//*[contains(@class,"badge--numeric")]', $link_node)->length) {
          $selected_term = \Drupal::service('jurenites_blog.tag_slug_resolver')->findTermBySlug($query_values['tag']);
          if (!$selected_term) {
            throw new RuntimeException('The existing counter tag could not be resolved.');
          }
          $menu_entity->set('field_footer_tag', $selected_term->id());
        }
        $menu_entity->save();
        $migrated_count++;
      }
    }
  }
  \Drupal::state()->set('jurenites_footer.migrated', TRUE);
  echo "Created $created_count menu items; migrated $migrated_count links.\n";
}
catch (Throwable $migration_error) {
  $database_transaction->rollBack();
  throw $migration_error;
}
