<?php

/**
 * @file
 * Local integration check: drush php:script tests/faq-block.php.
 */

use Drupal\block\Entity\Block;
use Drupal\user\Entity\User;

$block_storage = \Drupal::entityTypeManager()->getStorage('block_content');
$faq_blocks = $block_storage->loadByProperties(['uuid' => '56aca0c0-83bf-48b3-9e60-e224c9b56778']);
$faq_block = reset($faq_blocks);
if (!$faq_block) {
  throw new RuntimeException('FAQ block is missing.');
}
\Drupal::service('account_switcher')->switchTo(User::load(1));
foreach ($faq_block->getTranslationLanguages() as $language_code => $language_value) {
  $translated_block = $faq_block->getTranslation($language_code);
  if (count($translated_block->validate())) {
    throw new RuntimeException("Invalid FAQ content: $language_code");
  }
}
\Drupal::service('account_switcher')->switchBack();
$block_revision = $faq_block->getRevisionId();
\Drupal::moduleHandler()->loadInclude('jurenites_faq', 'install');
jurenites_faq_install();
$block_storage->resetCache([$faq_block->id()]);
if ($block_storage->load($faq_block->id())->getRevisionId() !== $block_revision) {
  throw new RuntimeException('Setup must preserve the existing FAQ revision.');
}
$faq_placement = Block::load('jurenites_theme_faq');
if ($faq_placement->getVisibility()['request_path']['pages'] !== "/about\n/obo" || $faq_placement->getWeight() !== 110) {
  throw new RuntimeException('FAQ placement must be at the bottom of About.');
}
\Drupal::service('account_switcher')->switchTo(User::load(1));
try {
  $block_form = \Drupal::service('entity.form_builder')->getForm($faq_block, 'edit');
  $question_widget = $block_form['field_faq_items']['widget'][0];
  if ((string) $question_widget['summary']['#title'] !== 'Question'
    || (string) $question_widget['value']['#title'] !== 'Answer'
    || !$question_widget['summary']['#required']) {
    throw new RuntimeException('FAQ editor must expose a required Question and formatted Answer.');
  }
}
finally {
  \Drupal::service('account_switcher')->switchBack();
}
foreach (['/' => 0, '/ru' => 0, '/about' => 1, '/ru/obo' => 1, '/cookbook' => 0] as $route_path => $expected_count) {
  $page_response = \Drupal::httpClient()->get('http://127.0.0.1' . $route_path, ['headers' => ['Host' => 'jurenites.local']]);
  $document_tree = new DOMDocument();
  @$document_tree->loadHTML((string) $page_response->getBody());
  $document_query = new DOMXPath($document_tree);
  if ($document_query->query('//section[@class="faq"]')->length !== $expected_count) {
    throw new RuntimeException("Unexpected FAQ count at $route_path");
  }
  if ($expected_count) {
    if ($document_query->query('//main//section[@class="faq"]/following::section[ancestor::main]')->length) {
      throw new RuntimeException("FAQ must be the last content section at $route_path");
    }
    foreach (['//details[@class="faq__item"]' => 2, '//details[@class="faq__item"][@open]' => 1, '//section[@class="faq"]//a[@href="/cookbook"]' => 1] as $query_text => $expected_nodes) {
      if ($document_query->query($query_text)->length !== $expected_nodes) {
        throw new RuntimeException("Invalid FAQ markup at $route_path: $query_text");
      }
    }
  }
}
print "FAQ translations, editor fields, revision preservation, route placement, disclosures and Cookbook link passed.\n";
