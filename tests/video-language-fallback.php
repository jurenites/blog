<?php

/**
 * @file
 * Verify all published Videos appear once on both public language listings.
 */

$node_storage = \Drupal::entityTypeManager()->getStorage('node');
$expected_video_ids = array_values($node_storage->getQuery()->accessCheck(FALSE)
  ->condition('type', 'video')->condition('status', 1)->execute());
sort($expected_video_ids, SORT_NUMERIC);
$video_view = \Drupal\views\Views::getView('frontpage');
$video_view->setDisplay('page_3');
$video_view->initPager();
$page_size = $video_view->getItemsPerPage();
if ($page_size < 1) {
  throw new RuntimeException('Expected a paged Videos display.');
}
$page_count = max(1, (int) ceil(count($expected_video_ids) / $page_size));
$request_options = ['headers' => ['Host' => 'jurenites.local'], 'http_errors' => FALSE];

foreach (['en' => '/videos', 'ru' => '/ru/videos'] as $language_code => $listing_path) {
  $listed_video_ids = [];
  for ($page_index = 0; $page_index < $page_count; $page_index++) {
    $page_response = \Drupal::httpClient()->get('http://127.0.0.1' . $listing_path . '?page=' . $page_index, $request_options);
    if ($page_response->getStatusCode() !== 200) {
      throw new RuntimeException("HTTP failure: $listing_path page $page_index");
    }
    $page_markup = html_entity_decode((string) $page_response->getBody(), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    preg_match_all('/data-article-id="(\d+)"/', $page_markup, $article_matches);
    foreach ($article_matches[1] as $video_id) {
      $video_entity = $node_storage->load($video_id);
      if (!$video_entity->hasTranslation('ru') && !str_contains($page_markup, $video_entity->label())) {
        throw new RuntimeException("Original title missing for untranslated Video $video_id on $listing_path");
      }
      $listed_video_ids[] = $video_id;
    }
  }
  sort($listed_video_ids, SORT_NUMERIC);
  if (array_map('intval', $listed_video_ids) !== array_map('intval', $expected_video_ids)) {
    throw new RuntimeException("Missing or duplicate Videos on $listing_path");
  }
  echo 'PASS: ' . count($listed_video_ids) . " Videos appear once on $listing_path, including untranslated originals.\n";
}
