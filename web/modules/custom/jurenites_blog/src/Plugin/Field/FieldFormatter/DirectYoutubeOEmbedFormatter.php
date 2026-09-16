<?php

declare(strict_types=1);

namespace Drupal\jurenites_blog\Plugin\Field\FieldFormatter;

use Drupal\Core\Field\FieldItemListInterface;
use Drupal\media\Plugin\Field\FieldFormatter\OEmbedFormatter;

/**
 * Renders YouTube locally while retaining core oEmbed for other providers.
 *
 * Registered through hook_field_formatter_info_alter() under the existing ID.
 */
class DirectYoutubeOEmbedFormatter extends OEmbedFormatter {

  /**
   * {@inheritdoc}
   */
  public function viewElements(FieldItemListInterface $field_items, $language_code) {
    $render_elements = [];
    foreach ($field_items as $item_delta => $field_item) {
      $main_property = $field_item->getFieldDefinition()->getFieldStorageDefinition()->getMainPropertyName();
      $video_url = trim((string) $field_item->{$main_property});
      $video_host = strtolower((string) parse_url($video_url, PHP_URL_HOST));
      if (!in_array($video_host, ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtu.be', 'youtube-nocookie.com', 'www.youtube-nocookie.com'], TRUE)) {
        // Keep each original delta, including when providers share a field.
        $provider_items = clone $field_items;
        $provider_items->setValue([$field_item->getValue()]);
        $provider_elements = parent::viewElements($provider_items, $language_code);
        if (isset($provider_elements[0])) {
          $render_elements[$item_delta] = $provider_elements[0];
        }
        continue;
      }

      $video_identifier = jurenites_blog_youtube_identifier($video_url);
      if (!in_array(strtolower((string) parse_url($video_url, PHP_URL_SCHEME)), ['http', 'https'], TRUE)
        || preg_match('/^[a-zA-Z0-9_-]{11}$/D', $video_identifier) !== 1) {
        continue;
      }

      $embed_url = 'https://www.youtube.com/embed/' . $video_identifier;
      parse_str((string) parse_url($video_url, PHP_URL_QUERY), $query_parameters);
      $start_value = $query_parameters['start'] ?? $query_parameters['t'] ?? '';
      if (is_string($start_value) && preg_match('/^\d+$/D', $start_value) === 1) {
        $start_seconds = (int) $start_value;
      }
      elseif (is_string($start_value) && preg_match('/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/D', $start_value, $time_parts) === 1) {
        $start_seconds = (int) ($time_parts[1] ?? 0) * 3600 + (int) ($time_parts[2] ?? 0) * 60 + (int) ($time_parts[3] ?? 0);
      }
      else {
        $start_seconds = 0;
      }
      if ($start_seconds > 0) {
        $embed_url .= '?start=' . $start_seconds;
      }

      $render_elements[$item_delta] = [
        '#type' => 'html_tag',
        '#tag' => 'iframe',
        '#attributes' => [
          'src' => $embed_url,
          'title' => $field_items->getEntity()->label() ?: $this->t('YouTube video'),
          'class' => ['media-oembed-content'],
          'loading' => $this->getSetting('loading')['attribute'],
          'allow' => 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
          'allowfullscreen' => TRUE,
          'referrerpolicy' => 'strict-origin-when-cross-origin',
        ],
        '#attached' => ['library' => ['media/oembed.formatter']],
      ];
    }
    return $render_elements;
  }

}
