<?php

namespace Drupal\jurenites_crossfade\Plugin\Field\FieldFormatter;

use Drupal\Core\Cache\CacheableMetadata;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Field\Attribute\FieldFormatter;
use Drupal\Core\Field\FieldDefinitionInterface;
use Drupal\Core\Field\FieldItemListInterface;
use Drupal\Core\Field\Plugin\Field\FieldFormatter\EntityReferenceFormatterBase;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Drupal\Core\StringTranslation\TranslatableMarkup;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Renders exactly two referenced image media items as an opacity crossfade.
 */
#[FieldFormatter(
  id: 'jurenites_two_image_crossfade',
  label: new TranslatableMarkup('Jurenites two-image crossfade'),
  description: new TranslatableMarkup('Alternates between two image media items with two-second holds and opacity transitions.'),
  field_types: ['entity_reference'],
)]
final class TwoImageCrossfadeFormatter extends EntityReferenceFormatterBase implements ContainerFactoryPluginInterface {

  /**
   * Constructs the formatter.
   */
  public function __construct(
    string $plugin_id,
    mixed $plugin_definition,
    FieldDefinitionInterface $field_definition,
    array $settings,
    string $label,
    string $view_mode,
    array $third_party_settings,
    private readonly EntityTypeManagerInterface $entity_type_manager,
  ) {
    parent::__construct($plugin_id, $plugin_definition, $field_definition, $settings, $label, $view_mode, $third_party_settings);
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition): static {
    return new static(
      $plugin_id,
      $plugin_definition,
      $configuration['field_definition'],
      $configuration['settings'],
      $configuration['label'],
      $configuration['view_mode'],
      $configuration['third_party_settings'],
      $container->get('entity_type.manager'),
    );
  }

  /**
   * {@inheritdoc}
   */
  public static function isApplicable(FieldDefinitionInterface $field_definition): bool {
    return $field_definition->getSetting('target_type') === 'media';
  }

  /**
   * {@inheritdoc}
   */
  public function viewElements(FieldItemListInterface $items, $langcode): array {
    $media_entities = array_values(array_slice($this->getEntitiesToView($items, $langcode), 0, 2));
    if (count($media_entities) !== 2) {
      return [];
    }

    $media_view_builder = $this->entity_type_manager->getViewBuilder('media');
    $image_frames = [];
    $crossfade_cacheability = new CacheableMetadata();

    foreach ($media_entities as $media_entity) {
      $image_frames[] = $media_view_builder->view($media_entity, 'default', $langcode);
      $crossfade_cacheability = $crossfade_cacheability->merge(CacheableMetadata::createFromObject($media_entity));
    }

    $elements = [
      0 => [
        '#theme' => 'jurenites_two_image_crossfade',
        '#image_frames' => $image_frames,
        '#attached' => [
          'library' => [
            'jurenites_crossfade/two-image-crossfade',
          ],
        ],
      ],
    ];
    $crossfade_cacheability->applyTo($elements[0]);

    return $elements;
  }

}
