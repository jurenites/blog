<?php

declare(strict_types=1);

/**
 * @file
 * Post-update functions for Jurenites Timeline.
 */

use Drupal\Core\StringTranslation\TranslatableMarkup;
use Drupal\Component\Utility\Html;
use Drupal\field\Entity\FieldConfig;
use Drupal\field\Entity\FieldStorageConfig;

/**
 * Adds calendar-scale lanes, evidence links, and company links.
 */
function jurenites_timeline_post_update_calendar_scale(): TranslatableMarkup {
  $field_definitions = [
    'field_timeline_organization_url' => [
      'cardinality' => 1,
      'label' => 'Organization website',
      'description' => 'Official company website. It appears only when the public timeline changes to this organization.',
      'title' => 0,
      'link_type' => 16,
    ],
    'field_timeline_proof_links' => [
      'cardinality' => -1,
      'label' => 'Proof links',
      'description' => 'Optional public project, case study, archived page, or Dropbox PDF links that show the work.',
      'title' => 2,
      'link_type' => 17,
    ],
  ];

  foreach ($field_definitions as $field_name => $field_definition) {
    $field_storage = FieldStorageConfig::loadByName('paragraph', $field_name);
    if ($field_storage === NULL) {
      $field_storage = FieldStorageConfig::create([
        'field_name' => $field_name,
        'entity_type' => 'paragraph',
        'type' => 'link',
        'settings' => [],
        'cardinality' => $field_definition['cardinality'],
        'translatable' => TRUE,
      ]);
      $field_storage->save();
    }

    if (FieldConfig::loadByName('paragraph', 'timeline_item', $field_name) === NULL) {
      FieldConfig::create([
        'field_storage' => $field_storage,
        'bundle' => 'timeline_item',
        'label' => $field_definition['label'],
        'description' => $field_definition['description'],
        'settings' => [
          'title' => $field_definition['title'],
          'link_type' => $field_definition['link_type'],
        ],
        'required' => FALSE,
        'translatable' => TRUE,
      ])->save();
    }
  }

  $summary_field = FieldConfig::loadByName('paragraph', 'timeline_item', 'field_timeline_summary');
  if ($summary_field !== NULL) {
    $summary_field->setLabel('Short description');
    $summary_field->setDescription('Optional short description of your role, contribution, or personal context from the CV.');
    $summary_field->save();
  }

  \Drupal::service('entity_field.manager')->clearCachedFieldDefinitions();
  $form_display = \Drupal::entityTypeManager()
    ->getStorage('entity_form_display')
    ->load('paragraph.timeline_item.default');
  if ($form_display !== NULL) {
    $form_display->setComponent('field_timeline_organization_url', [
      'type' => 'link_default',
      'weight' => 5,
      'region' => 'content',
      'settings' => [
        'placeholder_url' => 'https://company.example',
        'placeholder_title' => '',
      ],
    ]);
    $form_display->setComponent('field_timeline_emphasis', [
      'type' => 'options_select',
      'weight' => 6,
      'region' => 'content',
      'settings' => [],
    ]);
    $form_display->setComponent('field_timeline_summary', [
      'type' => 'text_textarea',
      'weight' => 7,
      'region' => 'content',
      'settings' => [
        'rows' => 3,
        'placeholder' => '',
      ],
    ]);
    $form_display->setComponent('field_timeline_proof_links', [
      'type' => 'link_default',
      'weight' => 8,
      'region' => 'content',
      'settings' => [
        'placeholder_url' => 'https://example.com/project-or-dropbox-proof',
        'placeholder_title' => 'Proof label',
      ],
    ]);
    $form_display->save();
  }

  $view_display = \Drupal::entityTypeManager()
    ->getStorage('entity_view_display')
    ->load('paragraph.timeline_item.default');
  if ($view_display !== NULL) {
    $view_display->removeComponent('field_timeline_organization_url');
    $view_display->removeComponent('field_timeline_proof_links');
    $view_display->save();
  }

  $timeline_node_ids = \Drupal::entityQuery('node')
    ->accessCheck(FALSE)
    ->condition('type', 'timeline')
    ->execute();
  $timeline_nodes = \Drupal::entityTypeManager()->getStorage('node')->loadMultiple($timeline_node_ids);
  $updated_item_count = 0;
  foreach ($timeline_nodes as $timeline_node) {
    foreach ($timeline_node->get('field_timeline_items')->referencedEntities() as $item_delta => $timeline_paragraph) {
      $organization_name = (string) $timeline_paragraph->get('field_timeline_organization')->value;
      $organization_url = match ($organization_name) {
        'Thrive.io' => 'https://thrive.io/',
        'OysterLabs.com' => 'https://www.oysterlabs.com/',
        'VolcanoIdeas.ae' => 'https://volcanoideas.ae/',
        default => '',
      };
      if ($organization_url === '' || !$timeline_paragraph->get('field_timeline_organization_url')->isEmpty()) {
        continue;
      }
      $timeline_paragraph->set('field_timeline_organization_url', ['uri' => $organization_url]);
      $timeline_paragraph->save();
      $timeline_node->get('field_timeline_items')->set($item_delta, [
        'target_id' => $timeline_paragraph->id(),
        'target_revision_id' => $timeline_paragraph->getRevisionId(),
      ]);
      $updated_item_count++;
    }
    $timeline_node->save();
  }

  return t('Added Timeline company and proof links and calendar lanes. Updated @item_count organization links.', [
    '@item_count' => $updated_item_count,
  ]);
}

/**
 * Moves Timeline out of the main navigation and into the footer.
 */
function jurenites_timeline_post_update_hide_main_menu_link(): TranslatableMarkup {
  \Drupal::moduleHandler()->loadInclude('jurenites_timeline', 'install');
  $timeline_menu_link = jurenites_timeline_ensure_menu_link();

  return t('Moved the Timeline link from the main navigation to the footer. Menu link ID: @menu_link_id.', [
    '@menu_link_id' => $timeline_menu_link->id(),
  ]);
}

/**
 * Adds Timeline to the bottom of the footer Information menu.
 */
function jurenites_timeline_post_update_move_link_to_footer(): TranslatableMarkup {
  \Drupal::moduleHandler()->loadInclude('jurenites_timeline', 'install');
  $timeline_menu_link = jurenites_timeline_ensure_menu_link();

  return t('Added Timeline to the footer Information menu. Menu link ID: @menu_link_id.', [
    '@menu_link_id' => $timeline_menu_link->id(),
  ]);
}

/**
 * Imports every project description and documented proof link from the CV.
 */
function jurenites_timeline_post_update_import_cv_project_details(): TranslatableMarkup {
  $timeline_records = require __DIR__ . '/data/timeline-items.php';
  $timeline_records_by_name = [];
  foreach ($timeline_records as $timeline_record) {
    if (($timeline_record['kind'] ?? 'project') !== 'project') {
      continue;
    }
    $timeline_records_by_name[$timeline_record['name']] = $timeline_record;
  }

  $timeline_node_ids = \Drupal::entityQuery('node')
    ->accessCheck(FALSE)
    ->condition('type', 'timeline')
    ->execute();
  $timeline_nodes = \Drupal::entityTypeManager()
    ->getStorage('node')
    ->loadMultiple($timeline_node_ids);
  $updated_project_count = 0;
  $imported_link_count = 0;

  foreach ($timeline_nodes as $timeline_node) {
    foreach ($timeline_node->get('field_timeline_items')->referencedEntities() as $item_delta => $timeline_paragraph) {
      $project_name = (string) $timeline_paragraph->get('field_timeline_name')->value;
      $timeline_record = $timeline_records_by_name[$project_name] ?? NULL;
      if ($timeline_record === NULL || empty($timeline_record['summary'])) {
        continue;
      }

      $timeline_paragraph->set('field_timeline_summary', [
        'value' => '<p>' . Html::escape($timeline_record['summary']) . '</p>',
        'format' => 'basic_html',
      ]);
      $legacy_links = array_merge($timeline_record['website_links'] ?? [], $timeline_record['store_links'] ?? [], $timeline_record['proofs'] ?? []);
      if ($legacy_links !== []) {
        $timeline_paragraph->set('field_timeline_proof_links', array_map(
          static fn (array $proof_link): array => [
            'uri' => $proof_link['url'],
            'title' => $proof_link['title'],
          ],
          $legacy_links,
        ));
        $imported_link_count += count($legacy_links);
      }
      $timeline_paragraph->save();
      $timeline_node->get('field_timeline_items')->set($item_delta, [
        'target_id' => $timeline_paragraph->id(),
        'target_revision_id' => $timeline_paragraph->getRevisionId(),
      ]);
      $updated_project_count++;
    }
    $timeline_node->save();
  }

  return t('Imported CV descriptions for @project_count Timeline projects and @link_count documented proof links.', [
    '@project_count' => $updated_project_count,
    '@link_count' => $imported_link_count,
  ]);
}

/**
 * Keeps Timeline authoring and presentation limited to duration projects.
 */
function jurenites_timeline_post_update_duration_projects_only(): TranslatableMarkup {
  $paragraph_storage = \Drupal::entityTypeManager()->getStorage('paragraph');
  $timeline_node_ids = \Drupal::entityQuery('node')
    ->accessCheck(FALSE)
    ->condition('type', 'timeline')
    ->execute();
  $timeline_nodes = \Drupal::entityTypeManager()
    ->getStorage('node')
    ->loadMultiple($timeline_node_ids);
  $detached_event_count = 0;

  foreach ($timeline_nodes as $timeline_node) {
    $retained_references = [];
    foreach ($timeline_node->get('field_timeline_items')->getValue() as $timeline_reference) {
      $timeline_revision_id = (int) ($timeline_reference['target_revision_id'] ?? 0);
      $timeline_paragraph = $timeline_revision_id > 0
        ? $paragraph_storage->loadRevision($timeline_revision_id)
        : $paragraph_storage->load((int) $timeline_reference['target_id']);
      if ($timeline_paragraph !== NULL
        && (string) $timeline_paragraph->get('field_timeline_kind')->value !== 'project') {
        $detached_event_count++;
        continue;
      }
      $retained_references[] = $timeline_reference;
    }

    if (count($retained_references) === $timeline_node->get('field_timeline_items')->count()) {
      continue;
    }
    $timeline_node->set('field_timeline_items', $retained_references);
    $current_introduction = (string) $timeline_node->get('body')->value;
    if ($current_introduction === '<p>Commercial projects and personal milestones, ordered by when each story began.</p>') {
      $timeline_node->set('body', [
        'value' => '<p>Commercial projects ordered by when each engagement began.</p>',
        'format' => (string) ($timeline_node->get('body')->format ?: 'basic_html'),
      ]);
    }
    $timeline_node->setNewRevision(TRUE);
    $timeline_node->setRevisionLogMessage('Removed one-time events from the commercial-project Timeline.');
    $timeline_node->save();
  }

  $timeline_form_display = \Drupal::entityTypeManager()
    ->getStorage('entity_form_display')
    ->load('paragraph.timeline_item.default');
  if ($timeline_form_display !== NULL) {
    $timeline_form_display->removeComponent('field_timeline_kind');
    $timeline_form_display->save();
  }

  return t('Detached @event_count one-time Timeline events and limited new records to duration projects.', [
    '@event_count' => $detached_event_count,
  ]);
}

/**
 * Separates product destinations from sources without reseeding editorial text.
 */
function jurenites_timeline_post_update_separate_product_links(): TranslatableMarkup {
  $config_directory = __DIR__ . '/config/install/';
  foreach (['field_timeline_website_links', 'field_timeline_store_links'] as $field_name) {
    if (FieldStorageConfig::loadByName('paragraph', $field_name) === NULL) {
      FieldStorageConfig::create(\Symfony\Component\Yaml\Yaml::parseFile($config_directory . 'field.storage.paragraph.' . $field_name . '.yml'))->save();
    }
    if (FieldConfig::loadByName('paragraph', 'timeline_item', $field_name) === NULL) {
      FieldConfig::create(\Symfony\Component\Yaml\Yaml::parseFile($config_directory . 'field.field.paragraph.timeline_item.' . $field_name . '.yml'))->save();
    }
  }
  $proof_field = FieldConfig::loadByName('paragraph', 'timeline_item', 'field_timeline_proof_links');
  $proof_config = \Symfony\Component\Yaml\Yaml::parseFile($config_directory . 'field.field.paragraph.timeline_item.field_timeline_proof_links.yml');
  $proof_field->setLabel($proof_config['label'])->setDescription($proof_config['description'])->save();
  $form_display = \Drupal::entityTypeManager()->getStorage('entity_form_display')->load('paragraph.timeline_item.default');
  $form_config = \Symfony\Component\Yaml\Yaml::parseFile($config_directory . 'core.entity_form_display.paragraph.timeline_item.default.yml');
  $view_display = \Drupal::entityTypeManager()->getStorage('entity_view_display')->load('paragraph.timeline_item.default');
  foreach (['field_timeline_website_links', 'field_timeline_store_links', 'field_timeline_proof_links'] as $field_name) {
    $form_display?->setComponent($field_name, $form_config['content'][$field_name]);
    $view_display?->removeComponent($field_name);
  }
  $form_display?->save();
  $view_display?->save();
  \Drupal::service('entity_field.manager')->clearCachedFieldDefinitions();

  \Drupal::entityTypeManager()->getStorage('paragraph')->resetCache();
  \Drupal::entityTypeManager()->getStorage('node')->resetCache();
  $project_records = require __DIR__ . '/data/timeline-project-details.php';
  $node_storage = \Drupal::entityTypeManager()->getStorage('node');
  $node_ids = $node_storage->getQuery()->accessCheck(FALSE)->condition('type', 'timeline')->execute();
  $updated_count = 0;
  foreach ($node_storage->loadMultiple($node_ids) as $timeline_node) {
    $updated_paragraphs = [];
    $node_changed = FALSE;
    foreach ($timeline_node->getTranslationLanguages() as $language_id => $language_object) {
      $node_translation = $timeline_node->getTranslation($language_id);
      foreach ($node_translation->get('field_timeline_items')->referencedEntities() as $item_delta => $timeline_paragraph) {
        $revision_key = $timeline_paragraph->id() . ':' . $timeline_paragraph->getRevisionId();
        if (!array_key_exists($revision_key, $updated_paragraphs)) {
          $paragraph_changed = FALSE;
          $project_name = (string) $timeline_paragraph->getUntranslated()->get('field_timeline_name')->value;
          $project_record = $project_records[$project_name] ?? [];
          // Only the reviewed URLs for this product can leave the source field.
          $destination_fields = [];
          foreach (['website_links' => 'field_timeline_website_links', 'store_links' => 'field_timeline_store_links'] as $record_key => $field_name) {
            foreach ($project_record[$record_key] ?? [] as $project_link) {
              $destination_fields[$project_link['url']] = [$field_name, $project_link['title']];
            }
          }
          foreach ($timeline_paragraph->getTranslationLanguages() as $paragraph_language => $paragraph_language_object) {
            $paragraph_translation = $timeline_paragraph->getTranslation($paragraph_language);
            $retained_sources = [];
            $sources_changed = FALSE;
            foreach ($paragraph_translation->get('field_timeline_proof_links')->getValue() as $source_link) {
              $destination_field = $destination_fields[$source_link['uri']] ?? NULL;
              if ($destination_field === NULL) {
                $retained_sources[] = $source_link;
                continue;
              }
              [$field_name, $store_title] = $destination_field;
              $existing_uris = array_column($paragraph_translation->get($field_name)->getValue(), 'uri');
              if (!in_array($source_link['uri'], $existing_uris, TRUE)) {
                if ($field_name === 'field_timeline_store_links') {
                  $source_link['title'] = $store_title;
                }
                $paragraph_translation->get($field_name)->appendItem($source_link);
              }
              $sources_changed = TRUE;
            }
            if ($sources_changed) {
              $paragraph_translation->set('field_timeline_proof_links', $retained_sources);
              $paragraph_changed = TRUE;
            }
            if ($project_name === 'ScatchApp') {
              foreach ($project_record['store_links'] as $store_link) {
                $existing_uris = array_column($paragraph_translation->get('field_timeline_store_links')->getValue(), 'uri');
                if (!in_array($store_link['url'], $existing_uris, TRUE)) {
                  $paragraph_translation->get('field_timeline_store_links')->appendItem(['uri' => $store_link['url'], 'title' => $store_link['title']]);
                  $paragraph_changed = TRUE;
                }
              }
            }
          }
          if ($paragraph_changed) {
            $timeline_paragraph->setNewRevision(TRUE);
            $timeline_paragraph->save();
            $updated_paragraphs[$revision_key] = $timeline_paragraph;
            $updated_count++;
          }
          else {
            $updated_paragraphs[$revision_key] = NULL;
          }
        }
        if ($updated_paragraphs[$revision_key] !== NULL) {
          $updated_paragraph = $updated_paragraphs[$revision_key];
          $node_translation->get('field_timeline_items')->set($item_delta, [
            'target_id' => $updated_paragraph->id(),
            'target_revision_id' => $updated_paragraph->getRevisionId(),
          ]);
          $node_changed = TRUE;
        }
      }
    }
    if ($node_changed) {
      $timeline_node->setNewRevision(TRUE);
      $timeline_node->setRevisionLogMessage('Separated product websites, app stores and sources; added Scatch store links.');
      $timeline_node->save();
    }
  }
  return t('Separated product destinations and sources on @count Timeline items.', ['@count' => $updated_count]);
}
