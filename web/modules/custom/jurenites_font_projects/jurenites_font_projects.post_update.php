<?php

declare(strict_types=1);

/**
 * @file
 * Post-update hooks for Jurenites font projects.
 */

use Drupal\Core\StringTranslation\TranslatableMarkup;
use Drupal\views\Entity\View;

/**
 * Adds the readable single-tag GET filter to the existing Portfolio View.
 */
function jurenites_font_projects_post_update_portfolio_tag_filter(): TranslatableMarkup {
  $portfolio_view = View::load('portfolio');
  if ($portfolio_view === NULL) {
    return t('The Portfolio View was unavailable; its tag filter was unchanged.');
  }

  $display_settings = $portfolio_view->get('display');
  if (!isset($display_settings['default'])) {
    return t('The Portfolio default display was unavailable; its tag filter was unchanged.');
  }

  $display_settings['default']['display_options']['arguments']['tag'] = [
    'id' => 'tag',
    'table' => 'taxonomy_index',
    'field' => 'tid',
    'relationship' => 'none',
    'group_type' => 'group',
    'admin_label' => 'Selected tag',
    'plugin_id' => 'taxonomy_index_tid',
    'default_action' => 'default',
    'exception' => [
      'value' => 'all',
      'title_enable' => FALSE,
      'title' => 'All',
    ],
    'title_enable' => FALSE,
    'title' => '',
    'default_argument_type' => 'jurenites_tag_slug',
    'default_argument_options' => [],
    'summary_options' => [
      'base_path' => '',
      'count' => TRUE,
      'override' => FALSE,
      'items_per_page' => 25,
    ],
    'summary' => [
      'sort_order' => 'asc',
      'number_of_records' => 0,
      'format' => 'default_summary',
    ],
    'specify_validation' => TRUE,
    'validate' => [
      'type' => 'entity:taxonomy_term',
      'fail' => 'not found',
    ],
    'validate_options' => [
      'bundles' => ['tags' => 'tags'],
      'access' => TRUE,
      'operation' => 'view',
      'multiple' => 0,
    ],
    'break_phrase' => FALSE,
    'add_table' => FALSE,
    'require_value' => FALSE,
    'reduce_duplicates' => FALSE,
  ];

  foreach (['default', 'page_1'] as $display_identifier) {
    if (!isset($display_settings[$display_identifier]['cache_metadata'])) {
      continue;
    }

    $cache_metadata = &$display_settings[$display_identifier]['cache_metadata'];
    $cache_metadata['contexts'] = array_values(array_unique(array_merge(
      $cache_metadata['contexts'] ?? [],
      ['url', 'url.query_args:tag'],
    )));
    $cache_metadata['tags'] = array_values(array_unique(array_merge(
      $cache_metadata['tags'] ?? [],
      ['taxonomy_term_list:tags'],
    )));
    unset($cache_metadata);
  }

  $portfolio_view->set('display', $display_settings);
  $portfolio_view->calculateDependencies();
  $portfolio_view->save();

  return t('Added the readable single-tag GET filter to the Portfolio View.');
}

/**
 * Adds the shared Font tag and the dynamic-count footer destination.
 */
function jurenites_font_projects_post_update_portfolio_font_navigation(): TranslatableMarkup {
  $navigation_result = jurenites_font_projects_ensure_portfolio_navigation();

  return t('Added Font tag @term_id to @project_count Projects and ensured footer link @menu_link_id.', [
    '@term_id' => $navigation_result['font_term_id'],
    '@project_count' => $navigation_result['updated_project_count'],
    '@menu_link_id' => $navigation_result['footer_link_id'],
  ]);
}

/**
 * Reuses an existing hashtag-style Font term after the first migration.
 */
function jurenites_font_projects_post_update_reuse_existing_font_tag(): TranslatableMarkup {
  $repaired_node_count = jurenites_font_projects_repair_duplicate_font_term();
  $navigation_result = jurenites_font_projects_ensure_portfolio_navigation();

  return t('Reused Font term @term_id, repaired @node_count references, and ensured footer link @menu_link_id.', [
    '@term_id' => $navigation_result['font_term_id'],
    '@node_count' => $repaired_node_count,
    '@menu_link_id' => $navigation_result['footer_link_id'],
  ]);
}
