<?php

declare(strict_types=1);

namespace Drupal\jurenites_two_tone_heading\Plugin\Field\FieldType;

use Drupal\Core\Field\Attribute\FieldType;
use Drupal\Core\Field\FieldItemBase;
use Drupal\Core\Field\FieldStorageDefinitionInterface;
use Drupal\Core\StringTranslation\TranslatableMarkup;
use Drupal\Core\TypedData\DataDefinition;

/**
 * Stores the editable segments and layout choices for a two-tone heading.
 */
#[FieldType(
  id: 'jurenites_two_tone_heading',
  label: new TranslatableMarkup('Two-tone heading'),
  description: new TranslatableMarkup('Stores two optional title segments and their placement as typed values.'),
  category: 'plain_text',
  default_widget: 'jurenites_two_tone_heading',
  default_formatter: 'jurenites_two_tone_heading',
  cardinality: 1,
)]
final class TwoToneHeadingItem extends FieldItemBase {

  /**
   * Allowed segment placement values.
   */
  public const PLACEMENT_OPTIONS = [
    'inline' => 'Inline',
    'new-line' => 'New line',
  ];

  /**
   * {@inheritdoc}
   */
  public static function propertyDefinitions(FieldStorageDefinitionInterface $field_definition): array {
    return [
      'soft_text' => DataDefinition::create('string')
        ->setLabel(new TranslatableMarkup('Title 2 (soft text)')),
      'trailing_text' => DataDefinition::create('string')
        ->setLabel(new TranslatableMarkup('Title 3 (trailing text)')),
      'soft_text_placement' => DataDefinition::create('string')
        ->setLabel(new TranslatableMarkup('Title 2 placement')),
      'trailing_text_placement' => DataDefinition::create('string')
        ->setLabel(new TranslatableMarkup('Title 3 placement')),
    ];
  }

  /**
   * {@inheritdoc}
   */
  public static function schema(FieldStorageDefinitionInterface $field_definition): array {
    return [
      'columns' => [
        'soft_text' => [
          'type' => 'varchar',
          'length' => 255,
        ],
        'trailing_text' => [
          'type' => 'varchar',
          'length' => 255,
        ],
        'soft_text_placement' => [
          'type' => 'varchar_ascii',
          'length' => 8,
        ],
        'trailing_text_placement' => [
          'type' => 'varchar_ascii',
          'length' => 8,
        ],
      ],
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function isEmpty(): bool {
    return trim((string) $this->soft_text) === ''
      && trim((string) $this->trailing_text) === '';
  }

  /**
   * {@inheritdoc}
   */
  public function preSave(): void {
    parent::preSave();

    $this->soft_text = trim((string) $this->soft_text);
    $this->trailing_text = trim((string) $this->trailing_text);
    $this->soft_text_placement = $this->normalizePlacement(
      (string) $this->soft_text_placement,
      'new-line',
    );
    $this->trailing_text_placement = $this->normalizePlacement(
      (string) $this->trailing_text_placement,
      'inline',
    );
  }

  /**
   * Returns a supported placement or its contextual default.
   */
  private function normalizePlacement(string $segment_placement, string $default_placement): string {
    return isset(self::PLACEMENT_OPTIONS[$segment_placement])
      ? $segment_placement
      : $default_placement;
  }

}
