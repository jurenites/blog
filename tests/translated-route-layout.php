<?php

/**
 * @file
 * Local check: vendor/bin/drush php:script tests/translated-route-layout.php.
 */

$video_page_paths = [
  'en' => '/videos',
  'ru' => '/ru/videos',
];
$request_options = [
  'headers' => ['Host' => 'jurenites.local'],
  'http_errors' => FALSE,
];

foreach ($video_page_paths as $page_language_id => $video_page_path) {
  $page_response = \Drupal::httpClient()->get(
    'http://localhost' . $video_page_path,
    $request_options,
  );
  if ($page_response->getStatusCode() !== 200) {
    throw new \RuntimeException(sprintf(
      'The %s Videos page returned HTTP %d.',
      $page_language_id,
      $page_response->getStatusCode(),
    ));
  }

  $page_markup = (string) $page_response->getBody();
  preg_match('/<body\b[^>]*\bclass="([^"]*)"/', $page_markup, $body_class_match);
  $body_class_names = preg_split('/\s+/', $body_class_match[1] ?? '') ?: [];
  if (!in_array('path-videos', $body_class_names, TRUE)) {
    throw new \RuntimeException(sprintf(
      'The %s Videos page is missing the language-neutral path-videos class.',
      $page_language_id,
    ));
  }
}

print 'PASS: translated Videos routes share the path-videos layout class.' . PHP_EOL;
