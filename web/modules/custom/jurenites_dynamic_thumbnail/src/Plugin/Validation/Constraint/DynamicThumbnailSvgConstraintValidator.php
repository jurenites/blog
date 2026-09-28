<?php

namespace Drupal\jurenites_dynamic_thumbnail\Plugin\Validation\Constraint;

use Drupal\jurenites_dynamic_thumbnail\ThumbnailSvg;
use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\ConstraintValidator;

final class DynamicThumbnailSvgConstraintValidator extends ConstraintValidator {
  public function validate(mixed $file_entity, Constraint $validation_constraint): void {
    $file_path = $file_entity->getFileUri();
    if (!is_readable($file_path) || filesize($file_path) > 5 * 1024 * 1024 || ThumbnailSvg::prepare(file_get_contents($file_path), 'validate') === NULL) {
      $this->context->addViolation($validation_constraint->message);
    }
  }
}
