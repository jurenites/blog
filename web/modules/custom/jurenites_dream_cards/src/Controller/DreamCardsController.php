<?php

namespace Drupal\jurenites_dream_cards\Controller;

use Drupal\jurenites_dream_cards\TopicCatalog;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Session\AnonymousUserSession;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/** Returns only published, anonymously readable dream-card fields. */
final class DreamCardsController extends ControllerBase {

  public function contentFeed(Request $request): JsonResponse {
    $anonymous_account = new AnonymousUserSession();
    $node_storage = $this->entityTypeManager()->getStorage('node');
    // Explicit anonymous checks below make the response identical for editors.
    $node_ids = $node_storage->getQuery()->accessCheck(FALSE)->condition('type', 'dream_card')
      ->condition('status', 1)->sort('field_dream_weight')->sort('nid')->range(0, 120)->execute();
    $card_items = [];
    foreach ($node_storage->loadMultiple($node_ids) as $card_node) {
      if ($card_node->hasTranslation('ru')) {
        $card_node = $card_node->getTranslation('ru');
      }
      if (!$card_node->isPublished() || !$card_node->access('view', $anonymous_account)) {
        continue;
      }
      $public_fields = ['field_dream_topic', 'field_dream_image', 'field_dream_text', 'field_dream_author', 'field_dream_tags'];
      foreach ($public_fields as $field_name) {
        if (!$card_node->get($field_name)->access('view', $anonymous_account)) {
          continue 2;
        }
      }
      $topic_key = (string) $card_node->get('field_dream_topic')->value;
      $quote_text = trim((string) $card_node->get('field_dream_text')->value);
      $image_file = $card_node->get('field_dream_image')->entity;
      if (!array_key_exists($topic_key, TopicCatalog::TOPIC_LABELS) || $quote_text === '' || mb_strlen($quote_text) > 320 || !$image_file || !str_starts_with($image_file->getFileUri(), 'public://')) {
        continue;
      }
      if (!in_array($image_file->getMimeType(), ['image/jpeg', 'image/png', 'image/webp'], TRUE) || $image_file->getSize() > 8 * 1024 * 1024) {
        continue;
      }
      $tag_labels = [];
      foreach ($card_node->get('field_dream_tags')->referencedEntities() as $tag_term) {
        if ($tag_term->access('view', $anonymous_account)) {
          $tag_labels[] = $tag_term->label();
        }
      }
      $card_items[] = [
        'id' => $card_node->uuid(), 'topic' => $topic_key, 'text' => $quote_text,
        'author' => trim((string) $card_node->get('field_dream_author')->value),
        'image_url' => \Drupal::service('file_url_generator')->generateAbsoluteString($image_file->getFileUri()),
        'image_revision' => $image_file->uuid() . ':' . $image_file->getChangedTime(),
        'tags' => $tag_labels,
      ];
    }
    $feed_revision = hash('sha256', json_encode($card_items, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));
    $feed_response = new JsonResponse(['schema_version' => 1, 'revision' => $feed_revision, 'cards' => $card_items]);
    $feed_response->headers->set('Cache-Control', 'public, max-age=0, must-revalidate');
    $feed_response->headers->set('X-Content-Type-Options', 'nosniff');
    $feed_response->setEtag($feed_revision);
    $feed_response->isNotModified($request);
    return $feed_response;
  }

}
