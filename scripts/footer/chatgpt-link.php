<?php

/**
 * @file
 * Adds the ChatGPT profile to the end of the local social footer column once.
 *
 * Run with drush php:script. Existing menu content is never overwritten.
 */

use Drupal\menu_link_content\Entity\MenuLinkContent;

$menu_storage = \Drupal::entityTypeManager()->getStorage('menu_link_content');
$chatgpt_uuid = '24bd260c-9a80-45d3-afce-a6f313ecb88b';
$chatgpt_url = 'https://chatgpt.com/u/jurenites';
if ($menu_storage->loadByProperties(['uuid' => $chatgpt_uuid])
  || $menu_storage->loadByProperties(['menu_name' => 'footer', 'link.uri' => $chatgpt_url])) {
  echo "ChatGPT footer link already exists; later menu edits preserved.\n";
  return;
}

$parent_links = $menu_storage->loadByProperties(['uuid' => '35c07f8b-c90a-4d82-9368-9a425035b8a7']);
$parent_link = reset($parent_links);
if (!$parent_link || $parent_link->getMenuName() !== 'footer'
  || $parent_link->get('field_footer_role')->value !== 'column') {
  throw new RuntimeException('Social networks footer column was not found. No link added.');
}

$parent_id = 'menu_link_content:' . $parent_link->uuid();
$social_links = $menu_storage->loadByProperties(['menu_name' => 'footer', 'parent' => $parent_id]);
$last_weight = $social_links ? max(array_map(static fn($social_link) => $social_link->getWeight(), $social_links)) : 0;
$chatgpt_link = MenuLinkContent::create([
  'uuid' => $chatgpt_uuid,
  'menu_name' => 'footer',
  'langcode' => 'en',
  'title' => 'ChatGPT',
  'link' => ['uri' => $chatgpt_url],
  'parent' => $parent_id,
  'weight' => $last_weight + 1,
  'enabled' => TRUE,
  'field_footer_role' => 'link',
  'field_footer_icon' => 'brand-chatgpt',
  'field_footer_hover_text' => 'jurenites',
  'field_footer_hover_paint' => 'var(--theme-dark-text-primary-default)',
  'field_footer_new_window' => TRUE,
]);
$chatgpt_link->addTranslation('ru', [
  'title' => 'ChatGPT',
  'field_footer_hover_text' => 'jurenites',
]);
$chatgpt_link->save();
echo "Added ChatGPT at the end of Social networks.\n";
