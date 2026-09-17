<?php

namespace Drupal\jurenites_footer\Plugin\Validation\Constraint;

use Drupal\jurenites_footer\HoverPaint;
use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\ConstraintValidator;

final class FooterHoverPaintConstraintValidator extends ConstraintValidator {

  public function validate($field_items, Constraint $validation_constraint): void {
    if (!$field_items) {
      return;
    }
    foreach ($field_items as $item_delta => $field_item) {
      $paint_value = trim((string) $field_item->value);
      if ($paint_value !== '' && HoverPaint::parse($paint_value) === NULL) {
        $this->context->buildViolation($validation_constraint->invalidPaint)
          ->atPath($item_delta . '.value')->addViolation();
      }
    }
  }

}
