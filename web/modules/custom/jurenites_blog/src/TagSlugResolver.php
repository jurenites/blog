<?php

declare(strict_types=1);

namespace Drupal\jurenites_blog;

use Drupal\Component\Transliteration\TransliterationInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\taxonomy\TermInterface;

/**
 * Creates canonical tag slugs and resolves them to Tags terms.
 */
final class TagSlugResolver {

  /**
   * Resolved terms keyed by canonical slug for the current request.
   *
   * @var array<string, \Drupal\taxonomy\TermInterface|null>
   */
  private array $resolvedTerms = [];

  /**
   * Constructs a tag slug resolver.
   */
  public function __construct(
    private readonly EntityTypeManagerInterface $entityTypeManager,
    private readonly TransliterationInterface $transliterationService,
  ) {}

  /**
   * Converts a tag label to its lowercase, URL-safe representation.
   */
  public function slugify(string $tagLabel): string {
    $displayPrefixFreeLabel = preg_replace('/^\s*#+\s*/u', '', $tagLabel) ?? '';
    $transliteratedLabel = $this->transliterationService->transliterate(
      $displayPrefixFreeLabel,
      'en',
      '-',
    );
    $lowercaseLabel = mb_strtolower($transliteratedLabel);
    $cleanTagSlug = preg_replace('/[^a-z0-9]+/', '-', $lowercaseLabel) ?? '';

    return trim($cleanTagSlug, '-');
  }

  /**
   * Finds one Tags term for an already-canonical slug.
   */
  public function findTermBySlug(string $tagSlug): ?TermInterface {
    if ($tagSlug === '' || $tagSlug !== $this->slugify($tagSlug)) {
      return NULL;
    }

    if (array_key_exists($tagSlug, $this->resolvedTerms)) {
      return $this->resolvedTerms[$tagSlug];
    }

    $termStorage = $this->entityTypeManager->getStorage('taxonomy_term');
    $termIds = $termStorage->getQuery()
      ->accessCheck(TRUE)
      ->condition('vid', 'tags')
      ->sort('tid')
      ->execute();

    $matchingTerm = NULL;
    foreach ($termStorage->loadMultiple($termIds) as $candidateTerm) {
      if (!$candidateTerm instanceof TermInterface
        || $this->slugify($candidateTerm->getUntranslated()->label()) !== $tagSlug) {
        continue;
      }

      if ($matchingTerm instanceof TermInterface) {
        $this->resolvedTerms[$tagSlug] = NULL;
        return NULL;
      }

      $matchingTerm = $candidateTerm;
    }

    $this->resolvedTerms[$tagSlug] = $matchingTerm;
    return $matchingTerm;
  }

}
