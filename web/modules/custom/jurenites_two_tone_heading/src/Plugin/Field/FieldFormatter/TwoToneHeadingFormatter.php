<?php

declare(strict_types=1);

namespace Drupal\jurenites_two_tone_heading\Plugin\Field\FieldFormatter;

use Drupal\Core\Field\Attribute\FieldFormatter;
use Drupal\Core\Field\FieldItemListInterface;
use Drupal\Core\Field\FormatterBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\StringTranslation\TranslatableMarkup;

/**
 * Renders a compound field through the shared Two-tone Heading theme hook.
 */
#[FieldFormatter(
  id: 'jurenites_two_tone_heading',
  label: new TranslatableMarkup('Two-tone heading'),
  field_types: ['jurenites_two_tone_heading'],
)]
final class TwoToneHeadingFormatter extends FormatterBase {

  /**
   * {@inheritdoc}
   */
  public static function defaultSettings(): array {
    return [
      'heading_level' => 'h2',
    ] + parent::defaultSettings();
  }

  /**
   * {@inheritdoc}
   */
  public function settingsForm(array $form, FormStateInterface $form_state): array {
    return [
      'heading_level' => [
        '#type' => 'select',
        '#title' => $this->t('Heading level'),
        '#options' => [
          'h2' => $this->t('Heading 2'),
          'h3' => $this->t('Heading 3'),
          'h4' => $this->t('Heading 4'),
          'h5' => $this->t('Heading 5'),
          'h6' => $this->t('Heading 6'),
        ],
        '#default_value' => $this->getSetting('heading_level'),
      ],
    ] + parent::settingsForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public function settingsSummary(): array {
    return [
      $this->t('Rendered as @heading_level.', [
        '@heading_level' => strtoupper((string) $this->getSetting('heading_level')),
      ]),
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function viewElements(FieldItemListInterface $items, $langcode): array {
    $heading_level = (string) $this->getSetting('heading_level');
    if (!in_array($heading_level, ['h2', 'h3', 'h4', 'h5', 'h6'], TRUE)) {
      $heading_level = 'h2';
    }

    $elements = [];
    foreach ($items as $item_delta => $field_item) {
      $elements[$item_delta] = [
        '#theme' => 'two_tone_heading',
        '#heading_level' => $heading_level,
        '#leading_text' => $items->getEntity()->label(),
        '#soft_text' => $field_item->soft_text,
        '#trailing_text' => $field_item->trailing_text,
        '#soft_text_placement' => $field_item->soft_text_placement,
        '#trailing_text_placement' => $field_item->trailing_text_placement,
      ];
    }

    return $elements;
  }

}
