<?php

namespace Drupal\jurenites_footer\Plugin\Validation\Constraint;

use Drupal\Core\StringTranslation\TranslatableMarkup;
use Drupal\Core\Validation\Attribute\Constraint;
use Symfony\Component\Validator\Constraint as SymfonyConstraint;

#[Constraint(
  id: 'FooterHoverPaint',
  label: new TranslatableMarkup('Footer hover color or gradient', [], ['context' => 'Validation']),
)]
final class FooterHoverPaintConstraint extends SymfonyConstraint {

  public $invalidPaint = 'Enter a hex color, a CSS token var(--token-name), or a linear-gradient with at least two such colors. Leave empty for the default yellow.';

}
