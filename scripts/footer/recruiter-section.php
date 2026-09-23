<?php

/**
 * @file
 * One-time editorial rearrangement for the existing local footer.
 * Back up the database, then run with drush php:script.
 */

use Drupal\menu_link_content\Entity\MenuLinkContent;

$state_key = 'jurenites_footer.recruiter_section_v1';
if (\Drupal::state()->get($state_key)) {
  echo "Recruiter section already arranged; later editorial changes preserved.\n";
  return;
}
$menu_storage = \Drupal::entityTypeManager()->getStorage('menu_link_content');
$required_uuids = [
  'contact_heading' => '226ebd9e-48ce-4e83-b982-0213584c1991',
  'recruiter_heading' => '690d71e1-8037-404a-b8cf-854e558eed3f',
  'linkedin_link' => 'c596865a-e6fb-4261-96cc-6dd045284b9b',
  'hh_link' => '26a7f523-84d8-45dd-861d-b868421f51f5',
  'privacy_link' => '152542da-1dad-4f78-8016-cc9a762af66b',
  'privacy_heading' => '14e48ebd-3e95-4af4-95bb-6f96bc8aa892',
];
$menu_items = [];
foreach ($required_uuids as $item_key => $item_uuid) {
  $matched_items = $menu_storage->loadByProperties(['uuid' => $item_uuid]);
  $menu_items[$item_key] = reset($matched_items);
  if (!$menu_items[$item_key]) {
    throw new RuntimeException("Missing existing footer item: $item_key. No editorial changes applied.");
  }
}
$database_transaction = \Drupal::database()->startTransaction();
$recruiter_heading = $menu_items['recruiter_heading'];
$recruiter_heading->set('title', 'For recruiters')->set('link', ['uri' => 'route:<nolink>'])
  ->set('parent', $menu_items['contact_heading']->getPluginId())->set('weight', 10)
  ->set('field_footer_role', 'section');
$russian_heading = $recruiter_heading->hasTranslation('ru') ? $recruiter_heading->getTranslation('ru') : $recruiter_heading->addTranslation('ru');
$russian_heading->set('title', 'Для рекрутеров');
// Descriptions belong to editors; preserve existing values and translations.
$recruiter_heading->save();
foreach (['linkedin_link', 'hh_link'] as $link_weight => $item_key) {
  $menu_items[$item_key]->set('parent', $recruiter_heading->getPluginId())->set('weight', $link_weight)
    ->set('field_footer_new_window', TRUE)->save();
}
// Retain the editor's existing hh.ru URL, hover text, and exact brand color.
$menu_items['hh_link']->set('field_footer_icon', 'brand-hh')->save();
$cv_uri = 'https://docs.google.com/document/d/1Aec-DgzHUGDfqpIy0LocrFvPZeIqcHZ1SBIWClsj2ZY/edit?tab=t.0';
$existing_cv = $menu_storage->loadByProperties(['menu_name' => 'footer', 'link.uri' => $cv_uri]);
$cv_link = reset($existing_cv) ?: MenuLinkContent::create(['menu_name' => 'footer', 'langcode' => 'en', 'link' => ['uri' => $cv_uri], 'enabled' => TRUE]);
$cv_link->set('title', 'My CV')->set('parent', $recruiter_heading->getPluginId())->set('weight', 2)
  ->set('field_footer_role', 'link')->set('field_footer_new_window', TRUE);
$russian_cv = $cv_link->hasTranslation('ru') ? $cv_link->getTranslation('ru') : $cv_link->addTranslation('ru');
$russian_cv->set('title', 'Моё резюме');
$cv_link->save();
$menu_items['privacy_link']->set('menu_name', 'footer-legal')->set('parent', '')->set('weight', 0)->save();
// Keep the old empty group recoverable, but remove it from the public footer.
$menu_items['privacy_heading']->set('enabled', FALSE)->save();
\Drupal::state()->set($state_key, TRUE);
echo "Arranged recruiter links and moved the existing privacy link to Footer legal.\n";
