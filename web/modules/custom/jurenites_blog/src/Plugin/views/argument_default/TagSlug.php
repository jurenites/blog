<?php

declare(strict_types=1);

namespace Drupal\jurenites_blog\Plugin\views\argument_default;

use Drupal\Core\Cache\Cache;
use Drupal\Core\Cache\CacheableDependencyInterface;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Drupal\Core\StringTranslation\TranslatableMarkup;
use Drupal\jurenites_blog\TagSlugResolver;
use Drupal\taxonomy\TermInterface;
use Drupal\views\Attribute\ViewsArgumentDefault;
use Drupal\views\Plugin\views\argument_default\ArgumentDefaultPluginBase;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Resolves the readable tag query value to an internal taxonomy term ID.
 */
#[ViewsArgumentDefault(
  id: 'jurenites_tag_slug',
  title: new TranslatableMarkup('Jurenites tag slug from query parameter'),
)]
final class TagSlug extends ArgumentDefaultPluginBase implements CacheableDependencyInterface, ContainerFactoryPluginInterface {

  /**
   * Constructs a tag slug default argument plugin.
   */
  public function __construct(
    array $configuration,
    $plugin_id,
    $plugin_definition,
    private readonly TagSlugResolver $tagSlugResolver,
  ) {
    parent::__construct($configuration, $plugin_id, $plugin_definition);
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition): static {
    return new static(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $container->get('jurenites_blog.tag_slug_resolver'),
    );
  }

  /**
   * {@inheritdoc}
   */
  public function getArgument(): string {
    $requestedTag = $this->view->getRequest()->query->get('tag');
    if ($requestedTag === NULL || $requestedTag === '') {
      return 'all';
    }

    if (!is_scalar($requestedTag)) {
      return 'invalid';
    }

    $selectedTerm = $this->tagSlugResolver->findTermBySlug((string) $requestedTag);
    return $selectedTerm instanceof TermInterface
      ? (string) $selectedTerm->id()
      : 'invalid';
  }

  /**
   * {@inheritdoc}
   */
  public function getCacheContexts(): array {
    return ['url.query_args:tag'];
  }

  /**
   * {@inheritdoc}
   */
  public function getCacheTags(): array {
    return ['taxonomy_term_list:tags'];
  }

  /**
   * {@inheritdoc}
   */
  public function getCacheMaxAge(): int {
    return Cache::PERMANENT;
  }

  /**
   * {@inheritdoc}
   */
  public function calculateDependencies(): array {
    return ['module' => ['jurenites_blog']];
  }

}
