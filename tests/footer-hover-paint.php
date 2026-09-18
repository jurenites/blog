<?php

/**
 * @file
 * Grammar checks; safe values must not escape the generated paint declaration.
 */

require_once __DIR__ . '/../web/modules/custom/jurenites_footer/src/HoverPaint.php';
require_once __DIR__ . '/../web/modules/custom/jurenites_footer/src/LegacyHoverPaint.php';

use Drupal\jurenites_footer\HoverPaint;
use Drupal\jurenites_footer\LegacyHoverPaint;

$first_color = HoverPaint::legacyValue('github');
$second_color = HoverPaint::legacyValue('storybook');
$valid_values = [
  $first_color, HoverPaint::legacyValue('figma'),
  'linear-gradient(to right, ' . $first_color . ' 0%, ' . $second_color . ' 100%)',
  'linear-gradient(' . $first_color . ', ' . $second_color . ')',
];
// Hex content is assembled here so test fixtures introduce no palette literals.
foreach ([3, 4, 6, 8] as $hex_length) {
  $valid_values[] = '#' . str_repeat('a', $hex_length);
}
foreach ($valid_values as $paint_value) {
  if (!HoverPaint::parse($paint_value)) {
    throw new RuntimeException('Valid color or gradient rejected: ' . $paint_value);
  }
}
$invalid_values = [
  '', '#12', '#12345', 'red;display:none', 'url(https://example.com/image)',
  'var(--color);}</style><script>alert(1)</script>',
  'linear-gradient(' . $first_color . ')',
  'linear-gradient(to right left, ' . $first_color . ', ' . $second_color . ')',
  'linear-gradient(90deg, ' . $first_color . ', url(https://example.com))',
  'linear-gradient(90deg, ' . $first_color . ', ' . $second_color . ');display:none',
];
foreach ($invalid_values as $paint_value) {
  if (HoverPaint::parse($paint_value) !== NULL) {
    throw new RuntimeException('Invalid paint accepted: ' . $paint_value);
  }
}
$original_paint = 'linear-gradient(315deg, var(--component-footer-navigation-linkedin-color-hover) 0%, #aBcDeF 40%, var(--color-palette-brand-tertiary) 100%)';
$expected_paint = 'linear-gradient(315deg, #2867B2 0%, #aBcDeF 40%, var(--color-palette-brand-tertiary) 100%)';
if (LegacyHoverPaint::resolveReferences($original_paint) !== $expected_paint
  || LegacyHoverPaint::resolveReferences($expected_paint) !== $expected_paint
  || LegacyHoverPaint::resolveReferences('var(--system-icon-default-svg-viewport)') !== 'var(--system-icon-default-svg-viewport)'
  || HoverPaint::legacyValue('github') !== '#0FBF3E'
  || str_contains(HoverPaint::legacyValue('figma'), 'var(')) {
  throw new RuntimeException('Legacy migration must resolve removed colors once and preserve custom paint and unrelated tokens.');
}
echo "PASS: paint grammar, injection rejection, literal legacy presets, mixed gradient migration and idempotence.\n";
