<?php

/**
 * @file
 * Local check: drush php:script tests/video-youtube-uniqueness.php.
 * Temporary fixture rows are rolled back; no YouTube requests are made.
 */

use Drupal\Core\Form\FormState;
use Drupal\jurenites_blog\Plugin\Validation\Constraint\UniqueYoutubeVideoConstraint;
use Drupal\node\Entity\Node;
use Drupal\user\Entity\User;

function youtube_unique_expect(bool $expected_condition, string $failure_message): void {
  if (!$expected_condition) {
    throw new RuntimeException($failure_message);
  }
}

function youtube_unique_violations(Node $video_node): array {
  $duplicate_violations = [];
  foreach ($video_node->validate() as $field_violation) {
    if ($field_violation->getConstraint() instanceof UniqueYoutubeVideoConstraint) {
      $duplicate_violations[] = $field_violation;
    }
  }
  return $duplicate_violations;
}

$database_connection = \Drupal::database();
$database_transaction = $database_connection->startTransaction();
$node_storage = \Drupal::entityTypeManager()->getStorage('node');
$account_switcher = \Drupal::service('account_switcher');
$account_switcher->switchTo(User::load(1));
$fixture_identifier = 'Aa' . substr(hash('sha256', random_bytes(32)), 0, 9);
$translated_identifier = 'Bb' . substr(hash('sha256', random_bytes(32)), 0, 9);

try {
  $fixture_node = Node::create([
    'type' => 'video',
    'title' => 'YouTube uniqueness fixture',
    'langcode' => 'en',
    'status' => 0,
    'uid' => 1,
  ]);
  $fixture_node->addTranslation('ru', ['title' => 'Translated uniqueness fixture']);
  $fixture_node->save();

  // Populate only the current field rows to avoid metadata downloads on save.
  // Validation queries current content, not historical revisions.
  foreach (['en' => $fixture_identifier, 'ru' => $translated_identifier] as $language_code => $video_identifier) {
    $database_connection->insert('node__field_youtube_video')->fields([
      'bundle' => 'video',
      'deleted' => 0,
      'entity_id' => $fixture_node->id(),
      'revision_id' => $fixture_node->getRevisionId(),
      'langcode' => $language_code,
      'delta' => 0,
      'field_youtube_video_input' => 'https://www.youtube.com/watch?v=' . $video_identifier,
      'field_youtube_video_video_id' => $video_identifier,
    ])->execute();
  }
  $node_storage->resetCache([$fixture_node->id()]);
  $fixture_node = $node_storage->load($fixture_node->id());
  $candidate_node = Node::create(['type' => 'video', 'title' => 'Candidate Video']);
  foreach ([
    'https://www.youtube.com/watch?v=' . $fixture_identifier,
    'https://youtu.be/' . $fixture_identifier . '?si=shared&t=42',
    'https://www.youtube.com/shorts/' . $fixture_identifier,
    'https://www.youtube.com/embed/' . $fixture_identifier . '?start=42',
    'https://www.youtube.com/watch?v=' . $fixture_identifier . '&list=playlist',
    'https://youtu.be/' . $translated_identifier,
  ] as $video_url) {
    $candidate_node->set('field_youtube_video', ['input' => $video_url]);
    $duplicate_violations = youtube_unique_violations($candidate_node);
    youtube_unique_expect(count($duplicate_violations) === 1, 'Equivalent URLs and translated drafts must be rejected: ' . $video_url);
    youtube_unique_expect($duplicate_violations[0]->getPropertyPath() === 'field_youtube_video.0.input', 'Duplicate error must target the visible URL input.');
  }
  echo "PASS: duplicate URLs, share parameters, Shorts, embeds, and unpublished translations are rejected.\n";

  $account_switcher->switchTo(new \Drupal\Core\Session\AnonymousUserSession());
  try {
    youtube_unique_expect(count(youtube_unique_violations($candidate_node)) === 1, 'Unpublished duplicates must be found regardless of viewing permissions.');
  }
  finally {
    $account_switcher->switchBack();
  }

  youtube_unique_expect(youtube_unique_violations($fixture_node) === [], 'Editing the existing Video must be allowed.');
  youtube_unique_expect(youtube_unique_violations($fixture_node->getTranslation('ru')) === [], 'Editing the existing translation must be allowed.');
  $candidate_node->set('field_youtube_video', ['input' => 'https://youtu.be/' . strtolower($fixture_identifier)]);
  youtube_unique_expect(youtube_unique_violations($candidate_node) === [], 'Different case-sensitive YouTube IDs must be allowed.');
  $candidate_node->set('field_youtube_video', ['input' => 'https://youtu.be/Cc' . substr(hash('sha256', random_bytes(32)), 0, 9)]);
  youtube_unique_expect(youtube_unique_violations($candidate_node) === [], 'A distinct video must be allowed.');
  $candidate_node->set('field_youtube_video', NULL);
  youtube_unique_expect(youtube_unique_violations($candidate_node) === [], 'Empty fields must defer to required-field validation.');
  youtube_unique_expect(count($candidate_node->validate()->getByField('field_youtube_video')) > 0, 'The required-field check must still reject an empty URL.');

  $edited_node = Node::create([
    'type' => 'video',
    'title' => 'Second uniqueness fixture',
    'status' => 0,
    'uid' => 1,
  ]);
  $edited_node->save();
  $edited_node->set('field_youtube_video', [
    'input' => 'https://youtu.be/' . $fixture_identifier,
    'video_id' => 'OldVideo123',
  ]);
  youtube_unique_expect(count(youtube_unique_violations($edited_node)) === 1, 'Changing another Video to a duplicate URL must fail, even with a stale video ID.');
  echo "PASS: own edits/translations and distinct IDs pass; changing another Video to a duplicate fails.\n";

  foreach (['default' => $candidate_node, 'edit' => $edited_node] as $form_operation => $submitted_node) {
    $form_object = \Drupal::entityTypeManager()->getFormObject('node', $form_operation);
    $form_object->setEntity($submitted_node);
    $form_state = (new FormState())->setValues([
      'title' => [['value' => 'Duplicate form submission']],
      'field_youtube_video' => [['input' => 'https://youtu.be/' . $fixture_identifier . '?t=42']],
    ]);
    \Drupal::formBuilder()->submitForm($form_object, $form_state);
    $form_errors = $form_state->getErrors();
    $youtube_errors = array_filter($form_errors, static fn (string $error_key): bool => str_starts_with($error_key, 'field_youtube_video'), ARRAY_FILTER_USE_KEY);
    youtube_unique_expect(count($youtube_errors) === 1, 'The real ' . $form_operation . ' form must reject the duplicate at the YouTube widget: ' . implode(', ', array_keys($form_errors)));
    youtube_unique_expect(str_contains((string) reset($youtube_errors), 'already been added'), 'The duplicate error must explain that the video was already added.');
    echo 'PASS: real Video ' . $form_operation . " form submission blocks the duplicate on its URL input.\n";
  }
}
finally {
  $database_transaction->rollBack();
  $node_storage->resetCache();
  $account_switcher->switchBack();
}
