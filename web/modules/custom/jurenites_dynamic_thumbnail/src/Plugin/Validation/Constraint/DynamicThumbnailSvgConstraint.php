<?php

namespace Drupal\jurenites_dynamic_thumbnail\Plugin\Validation\Constraint;

use Drupal\Core\StringTranslation\TranslatableMarkup;
use Drupal\Core\Validation\Attribute\Constraint;
use Symfony\Component\Validator\Constraint as SymfonyConstraint;

#[Constraint(id: 'DynamicThumbnailSvg', label: new TranslatableMarkup('Layered thumbnail SVG'), type: 'file')]
final class DynamicThumbnailSvgConstraint extends SymfonyConstraint {
  public string $message = 'Upload a passive SVG with a valid viewBox and positive width and height. Depth layers and a background gradient are optional. Scripts, event handlers, styles and external references are not allowed.';
}
