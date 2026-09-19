<?php

namespace Drupal\jurenites_footer;

/**
 * Frozen pre-removal colors for content migrations, never runtime defaults.
 */
final class LegacyHoverPaint {

  private const COLOR_VALUES = [
    'gmail-gradient-red-color' => '#FC413D',
    'gmail-gradient-light-green-color' => '#60D673',
    'gmail-gradient-green-color' => '#42C868',
    'gmail-gradient-deep-green-color' => '#0EBC5F',
    'gmail-gradient-teal-color' => '#00A9BB',
    'gmail-gradient-blue-color' => '#3C90FF',
    'gmail-gradient-deep-blue-color' => '#3186FF',
    'gmail-gradient-pink-color' => '#FF63A0',
    'gmail-gradient-orange-color' => '#FC5C30',
    'gmail-gradient-amber-color' => '#FEB10C',
    'gmail-gradient-yellow-color' => '#FEC700',
    'gmail-gradient-light-yellow-color' => '#FFDB0F',
    'gmail-color-hover' => '#EA4335',
    'yandex-mail-color-hover' => '#FFCC00',
    'yandex-mail-light-yellow-color' => '#FFDA3E',
    'yandex-mail-red-color' => '#FF3333',
    'linkedin-color-hover' => '#2867B2',
    'facebook-color-hover' => '#1877F2',
    'vk-color-hover' => '#0077FF',
    'youtube-color-hover' => '#FF0033',
    'soundcloud-color-hover' => '#FF5500',
    'steam-color-hover' => '#66C0F4',
    'telegram-color-hover' => '#2AABEE',
    'github-color-hover' => '#0FBF3E',
    'storybook-color-hover' => '#FF4785',
    'figma-overlay-bl-color' => '#F24E1E',
    'figma-overlay-og-color' => '#FF7262',
    'figma-overlay-jur-color' => '#A259FF',
    'figma-overlay-eni-color' => '#1ABCFE',
    'figma-overlay-tes-color' => '#0ACF83',
  ];

  /**
   * Resolves only removed footer tokens, preserving all other editorial text.
   */
  public static function resolveReferences(string $paint_value): string {
    return preg_replace_callback(
      '/var\(\s*--component-footer-navigation-([a-z0-9-]+)\s*\)/',
      static fn(array $token_match): string => self::COLOR_VALUES[$token_match[1]] ?? $token_match[0],
      $paint_value,
    );
  }

}
