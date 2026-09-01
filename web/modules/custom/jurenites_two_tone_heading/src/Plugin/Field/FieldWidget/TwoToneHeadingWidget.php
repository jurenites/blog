<?php

declare(strict_types=1);

namespace Drupal\jurenites_two_tone_heading\Plugin\Field\FieldWidget;

use Drupal\Core\Field\Attribute\FieldWidget;
use Drupal\Core\Field\FieldItemListInterface;
use Drupal\Core\Field\WidgetBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\StringTranslation\TranslatableMarkup;
use Drupal\jurenites_two_tone_heading\Plugin\Field\FieldType\TwoToneHeadingItem;

/**
 * Provides structured editor controls for a two-tone heading.
 */
#[FieldWidget(
  id: 'jurenites_two_tone_heading',
  label: new TranslatableMarkup('Two-tone heading controls'),
  field_types: ['jurenites_two_tone_heading'],
)]
final class TwoToneHeadingWidget extends WidgetBase {

  /**
   * {@inheritdoc}
   */
  public function formElement(FieldItemListInterface $items, $delta, array $element, array &$form, FormStateInterface $form_state): array {
    $field_item = $items[$delta] ?? NULL;
    $placement_options = array_map(
      fn(string $placement_label): TranslatableMarkup => $this->t($placement_label),
      TwoToneHeadingItem::PLACEMENT_OPTIONS,
    );

    $element['soft_text'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Title 2 (soft text)'),
      '#description' => $this->t('Optional softer-color text rendered after the node Title.'),
      '#default_value' => $field_item?->soft_text ?? '',
      '#maxlength' => 255,
    ];
    $element['soft_text_placement'] = [
      '#type' => 'radios',
      '#title' => $this->t('Title 2 placement'),
      '#options' => $placement_options,
      '#default_value' => $field_item?->soft_text_placement ?: 'new-line',
    ];
    $element['trailing_text'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Title 3 (trailing text)'),
      '#description' => $this->t('Optional strong-color text rendered after Title 2.'),
      '#default_value' => $field_item?->trailing_text ?? '',
      '#maxlength' => 255,
    ];
    $element['trailing_text_placement'] = [
      '#type' => 'radios',
      '#title' => $this->t('Title 3 placement'),
      '#options' => $placement_options,
      '#default_value' => $field_item?->trailing_text_placement ?: 'inline',
    ];

    return $element;
  }

}
