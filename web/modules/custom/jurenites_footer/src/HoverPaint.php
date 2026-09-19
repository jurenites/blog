<?php

namespace Drupal\jurenites_footer;

/**
 * Parses a small, URL-free CSS paint grammar for editable footer links.
 */
final class HoverPaint {

  /**
   * Returns validated paint and fallback color, or NULL for invalid input.
   */
  public static function parse(string $paint_value): ?array {
    $paint_value = trim($paint_value);
    $color_pattern = '(?:#[0-9a-f]{3}(?:[0-9a-f]{3})?|#[0-9a-f]{4}(?:[0-9a-f]{4})?|var\(--[a-z][a-z0-9-]*\))';
    if (preg_match('/^' . $color_pattern . '$/iD', $paint_value)) {
      return ['value' => $paint_value, 'fallback' => $paint_value, 'gradient' => FALSE];
    }
    if (!preg_match('/^linear-gradient\((.*)\)$/iD', $paint_value, $gradient_match)) {
      return NULL;
    }
    // Supported colors have no nested commas, so each stop is unambiguous.
    $gradient_parts = array_map('trim', explode(',', $gradient_match[1]));
    if (preg_match('/^(?:-?\d+(?:\.\d+)?deg|to (?:left|right|top|bottom)(?: (?:left|right|top|bottom))?)$/D', $gradient_parts[0])) {
      $gradient_direction = array_shift($gradient_parts);
      if (str_starts_with($gradient_direction, 'to ')) {
        $direction_words = explode(' ', substr($gradient_direction, 3));
        if (count($direction_words) === 2 && (count(array_intersect($direction_words, ['left', 'right'])) !== 1 || count(array_intersect($direction_words, ['top', 'bottom'])) !== 1)) {
          return NULL;
        }
      }
    }
    if (count($gradient_parts) < 2 || count($gradient_parts) > 12) {
      return NULL;
    }
    $fallback_color = '';
    foreach ($gradient_parts as $gradient_stop) {
      if (!preg_match('/^(' . $color_pattern . ')(?:\s+(?:100|\d{1,2})(?:\.\d+)?%)?$/iD', $gradient_stop, $stop_match)) {
        return NULL;
      }
      $fallback_color = $fallback_color ?: $stop_match[1];
    }
    return ['value' => $paint_value, 'fallback' => $fallback_color, 'gradient' => TRUE];
  }

  /**
   * Converts former preset identifiers to literal content during migration.
   */
  public static function legacyValue(string $color_name): string {
    if ($color_name === 'figma') {
      $color_stops = array_map(static fn(string $color_part): string => 'var(--component-footer-navigation-figma-overlay-' . $color_part . '-color)', ['bl', 'og', 'jur', 'eni', 'tes']);
      return LegacyHoverPaint::resolveReferences('linear-gradient(90deg, ' . implode(', ', $color_stops) . ')');
    }
    if (in_array($color_name, ['linkedin', 'facebook', 'vk', 'youtube', 'soundcloud', 'steam', 'telegram', 'gmail', 'yandex-mail', 'github', 'storybook'], TRUE)) {
      return LegacyHoverPaint::resolveReferences('var(--component-footer-navigation-' . $color_name . '-color-hover)');
    }
    return '';
  }

}
