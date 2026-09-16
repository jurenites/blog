<?php

namespace Drupal\jurenites_blog\Plugin\Validation\Constraint;

use Drupal\Core\DependencyInjection\ContainerInjectionInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\ConstraintValidator;

/**
 * Checks video identity across published and unpublished Video translations.
 */
class UniqueYoutubeVideoConstraintValidator extends ConstraintValidator implements ContainerInjectionInterface {

  public function __construct(protected EntityTypeManagerInterface $entityTypeManager) {}

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $service_container) {
    return new static($service_container->get('entity_type.manager'));
  }

  /**
   * {@inheritdoc}
   */
  public function validate($field_items, Constraint $validation_constraint): void {
    if (!$field_items || $field_items->isEmpty()) {
      return;
    }

    $video_node = $field_items->getEntity();
    $node_storage = $this->entityTypeManager->getStorage('node');
    foreach ($field_items as $item_delta => $field_item) {
      // Read the submitted URL, which may differ from a previously stored ID.
      // Use the same parser as the widget so share URLs identify the same video.
      $video_identifier = youtube_get_video_id(trim((string) $field_item->input));
      if (!$video_identifier) {
        continue;
      }

      $duplicate_query = $node_storage->getQuery()
        ->accessCheck(FALSE)
        ->condition('type', 'video')
        ->condition('field_youtube_video.video_id', $video_identifier);
      if (!$video_node->isNew()) {
        // Edits and translations of this same node are allowed.
        $duplicate_query->condition('nid', $video_node->id(), '<>');
      }

      foreach ($node_storage->loadMultiple($duplicate_query->execute()) as $existing_node) {
        foreach ($existing_node->getTranslationLanguages() as $language_code => $translation_language) {
          $existing_items = $existing_node->getTranslation($language_code)->get('field_youtube_video');
          foreach ($existing_items as $existing_item) {
            // YouTube IDs are case sensitive, even with a case-insensitive DB.
            if ((string) $existing_item->video_id === $video_identifier) {
              $this->context->buildViolation($validation_constraint->duplicateMessage)
                ->atPath($item_delta . '.input')
                ->addViolation();
              continue 4;
            }
          }
        }
      }
    }
  }

}
