<?php

namespace Drupal\jurenites_blog\Plugin\Validation\Constraint;

use Drupal\Core\StringTranslation\TranslatableMarkup;
use Drupal\Core\Validation\Attribute\Constraint;
use Symfony\Component\Validator\Constraint as SymfonyConstraint;

/**
 * Prevents adding the same YouTube video to separate Video nodes.
 */
#[Constraint(
  id: 'UniqueYoutubeVideo',
  label: new TranslatableMarkup('Unique YouTube video', [], ['context' => 'Validation']),
)]
class UniqueYoutubeVideoConstraint extends SymfonyConstraint {

  /**
   * Message shown on the YouTube URL input when the video already exists.
   *
   * @var string
   */
  public $duplicateMessage = 'This YouTube video has already been added. Please edit the existing Video or choose a different YouTube video.';

}
