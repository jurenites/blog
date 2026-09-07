<?php

declare(strict_types=1);

/**
 * @file
 * Post-update functions for Jurenites Timeline.
 */

use Drupal\Core\StringTranslation\TranslatableMarkup;
use Drupal\field\Entity\FieldConfig;
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\paragraphs\Entity\Paragraph;

/**
 * Adds calendar-scale lanes, evidence links, company links, and the 1989 event.
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
    $has_birth_event = FALSE;
    foreach ($timeline_node->get('field_timeline_items')->referencedEntities() as $item_delta => $timeline_paragraph) {
      if ((string) $timeline_paragraph->get('field_timeline_name')->value === 'My birthday') {
        $has_birth_event = TRUE;
      }
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

    if (!$has_birth_event) {
      $birthday_paragraph = Paragraph::create([
        'type' => 'timeline_item',
        'field_timeline_name' => 'My birthday',
        'field_timeline_kind' => 'event',
        'field_timeline_periods' => [
          'value' => '1989-01-18',
          'end_value' => '1989-01-18',
        ],
        'field_timeline_emphasis' => 'standard',
        'field_timeline_summary' => [
          'value' => '<p>The beginning of my journey.</p>',
          'format' => 'basic_html',
        ],
      ]);
      $timeline_node->get('field_timeline_items')->appendItem($birthday_paragraph);
    }
    $timeline_node->save();
  }

  return t('Added Timeline company and proof links, calendar lanes, and the January 18, 1989 milestone. Updated @item_count organization links.', [
    '@item_count' => $updated_item_count,
  ]);
}
