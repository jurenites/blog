<?php

/**
 * @file
 * Add the Testing footer link once, preserving later editorial changes.
 * Run with drush php:script; FOOTER_TEST_URL selects the environment's URL.
 */

use Drupal\menu_link_content\Entity\MenuLinkContent;

$testing_url = getenv('FOOTER_TEST_URL');
if (!in_array($testing_url, ['http://test.jurenites.local/', 'http://test.jurenites.com/', 'https://test.jurenites.com/'], TRUE)) {
  throw new RuntimeException('Set FOOTER_TEST_URL to the local or production testing URL.');
}
$menu_storage = \Drupal::entityTypeManager()->getStorage('menu_link_content');
$testing_uuid = 'fe92dc8f-fdb8-4a17-a8cc-b386f06e6088';
$existing_links = $menu_storage->loadByProperties(['uuid' => $testing_uuid]);
if ($existing_links) {
  $testing_link = reset($existing_links);
  if ($testing_link->get('field_footer_icon')->isEmpty()) {
    $testing_link->setNewRevision(TRUE);
    $testing_link->set('field_footer_icon', 'brand-testing')->save();
    echo "Added the Testing T icon; existing destination and editorial content preserved.\n";
  }
  else {
    echo "Testing link already has an icon; later editorial changes preserved.\n";
  }
  return;
}
$existing_links = $menu_storage->loadByProperties(['menu_name' => 'footer', 'link.uri' => $testing_url]);
if ($existing_links) {
  echo "Testing destination already exists; no duplicate added.\n";
  return;
}
$cookbook_links = $menu_storage->loadByProperties(['uuid' => 'c7c1677c-cbdd-4af5-a353-956abda5a03a']);
$brandbook_links = $menu_storage->loadByProperties(['uuid' => 'bf01771e-e628-496d-afbc-726bb4af3fa5']);
$cookbook_link = reset($cookbook_links);
$brandbook_link = reset($brandbook_links);
if (!$cookbook_link || !$brandbook_link
  || $cookbook_link->getMenuName() !== 'footer' || $brandbook_link->getMenuName() !== 'footer'
  || $cookbook_link->getParentId() !== $brandbook_link->getParentId()
  || $cookbook_link->getWeight() >= $brandbook_link->getWeight()) {
  throw new RuntimeException('Expected Cookbook / Brandbook placement is missing. No changes applied; use the menu editor.');
}

$database_transaction = \Drupal::database()->startTransaction();
try {
  $testing_weight = $brandbook_link->getWeight();
  $sibling_links = $menu_storage->loadByProperties(['menu_name' => 'footer', 'parent' => $brandbook_link->getParentId()]);
  foreach ($sibling_links as $sibling_link) {
    if ($sibling_link->getWeight() >= $testing_weight) {
      $sibling_link->setNewRevision(TRUE);
      $sibling_link->set('weight', $sibling_link->getWeight() + 1)->save();
    }
  }
  $testing_link = MenuLinkContent::create([
    'uuid' => $testing_uuid,
    'menu_name' => 'footer',
    'langcode' => 'en',
    'title' => 'Testing',
    'link' => ['uri' => $testing_url],
    'parent' => $brandbook_link->getParentId(),
    'weight' => $testing_weight,
    'enabled' => TRUE,
    'field_footer_role' => 'link',
    'field_footer_icon' => 'brand-testing',
  ]);
  $testing_link->addTranslation('ru', ['title' => 'Тестирование']);
  $testing_link->save();
}
catch (\Throwable $change_error) {
  $database_transaction->rollBack();
  throw $change_error;
}
echo "Added Testing between Cookbook and Brandbook: $testing_url\n";
