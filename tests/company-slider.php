<?php

/**
 * Run with drush php:script /opt/drupal/tests/company-slider.php.
 * Checks authored entities, translations, deep links and repeat-safe setup.
 */

use Drupal\block\Entity\Block;
use Drupal\user\Entity\User;

function company_check(bool $check_result, string $check_message): void {
  if (!$check_result) {
    throw new RuntimeException($check_message);
  }
}

$account_switcher = \Drupal::service('account_switcher');
$account_switcher->switchTo(User::load(1));
try {
  $company_blocks = \Drupal::entityTypeManager()->getStorage('block_content')->loadByProperties(['uuid' => '1fe32d75-ad16-4b41-bc9d-b75085794a2e']);
  $company_block = reset($company_blocks);
  company_check((bool) $company_block, 'Company block exists.');
  $revision_before = $company_block->getRevisionId();
  $project_catalogue = json_decode(file_get_contents(DRUPAL_ROOT . '/modules/custom/jurenites_companies/data/companies.json'), TRUE, 512, JSON_THROW_ON_ERROR);
  $timeline_nodes = \Drupal::entityTypeManager()->getStorage('node')->loadByProperties(['type' => 'timeline']);
  $timeline_node = reset($timeline_nodes);
  $timeline_variables = ['node' => $timeline_node];
  jurenites_timeline_preprocess_node($timeline_variables);
  $target_details = [];
  foreach ($timeline_variables['timeline_year_groups'] as $year_group) {
    foreach ($year_group['timeline_details'] as $timeline_detail) {
      company_check(!isset($target_details[$timeline_detail['detail_id']]), 'Every timeline detail ID is unique.');
      $target_details[$timeline_detail['detail_id']] = $timeline_detail['item_name'];
    }
  }
  foreach (['en', 'ru'] as $language_id) {
    $translated_block = $company_block->getTranslation($language_id);
    company_check(count($translated_block->validate()) === 0, 'Block fields validate in ' . $language_id);
    $company_items = $translated_block->get('field_companies_items')->referencedEntities();
    company_check(count($company_items) === 5, 'All five companies exist in ' . $language_id);
    foreach ($company_items as $company_index => $company_entity) {
      $company_entity = $company_entity->getTranslation($language_id);
      company_check(count($company_entity->validate()) === 0, 'Company fields validate: ' . $company_entity->get('field_company_name')->value);
      $project_uri = $company_entity->get('field_company_projects')->uri;
      $project_target = $project_catalogue[$company_index]['target_project'];
      if ($project_target === '') {
        company_check($project_uri === 'internal:/timeline', 'Thrive goes to the timeline without a fragment.');
      }
      else {
        $fragment_id = parse_url($project_uri, PHP_URL_FRAGMENT);
        company_check(($target_details[$fragment_id] ?? NULL) === $project_target, 'The company fragment reaches the requested project: ' . $project_target);
      }
    }
  }
  \Drupal::moduleHandler()->loadInclude('jurenites_companies', 'install');
  jurenites_companies_install();
  $company_block = \Drupal::entityTypeManager()->getStorage('block_content')->loadUnchanged($company_block->id());
  company_check($company_block->getRevisionId() === $revision_before, 'Repeated setup preserves the authored block revision.');
  $company_placement = Block::load('jurenites_theme_companies');
  company_check($company_placement->getVisibility()['request_path']['pages'] === "/about\n/obo", 'Only About routes show the company slider.');
  echo "PASS: Five companies, EN/RU validation, four exact timeline targets, unanchored Thrive, unique IDs and repeat-safe setup.\n";
}
finally {
  $account_switcher->switchBack();
}
