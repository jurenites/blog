<?php

use Drupal\jurenites_dynamic_thumbnail\ThumbnailSvg;
use Drupal\node\Entity\Node;
use Drupal\Core\Session\AnonymousUserSession;

function thumbnail_expect(bool $test_condition, string $failure_message): void {
  if (!$test_condition) throw new \RuntimeException($failure_message);
}

$asset_directory = DRUPAL_ROOT . '/../src/public/assets/images/dynamic-thumbnails/';
foreach (['roundabout', '4pixel', 'smep', 'oksenate'] as $artwork_name) {
  $svg_source = file_get_contents($asset_directory . $artwork_name . '.svg');
  $prepared_markup = ThumbnailSvg::prepare($svg_source, 'test-' . $artwork_name);
  thumbnail_expect($prepared_markup !== NULL, 'Rejected supplied artwork: ' . $artwork_name);
  thumbnail_expect(substr_count($prepared_markup, 'data-thumbnail-depth=') === ($artwork_name === 'smep' ? 5 : 3), 'Expected every named depth group.');
  thumbnail_expect(str_contains($prepared_markup, 'data-thumbnail-highlight') === ($artwork_name !== 'oksenate'), 'Only artwork with an authored background highlight should have gradient motion.');
  thumbnail_expect(ThumbnailSvg::prepare(str_replace('<svg ', '<svg onload="alert(1)" ', $svg_source), 'test') === NULL, 'Event handlers must be rejected.');
  thumbnail_expect(ThumbnailSvg::prepare(str_replace('</svg>', '<script>alert(1)</script></svg>', $svg_source), 'test') === NULL, 'Scripts must be rejected.');
  thumbnail_expect(ThumbnailSvg::prepare(str_replace('</svg>', '<image href="https://example.com/a.svg"/></svg>', $svg_source), 'test') === NULL, 'External image references must be rejected.');
}
$account_switcher = \Drupal::service('account_switcher');
$account_switcher->switchTo(new AnonymousUserSession());
try {
  $project_nodes = \Drupal::entityTypeManager()->getStorage('node')->loadByProperties(['type' => 'project']);
  $artwork_file = NULL;
  foreach ($project_nodes as $project_node) {
    thumbnail_expect(!$project_node->field_dynamic_thumbnail->isEmpty(), 'Project is missing its thumbnail.');
    $artwork_file = $project_node->field_dynamic_thumbnail->entity;
    $render_build = \Drupal::entityTypeManager()->getViewBuilder('node')->view($project_node, 'teaser');
    $rendered_markup = (string) \Drupal::service('renderer')->renderRoot($render_build);
    thumbnail_expect(str_contains($rendered_markup, 'data-dynamic-thumbnail'), 'Project teaser did not render dynamic artwork.');
    thumbnail_expect(str_contains($rendered_markup, 'has-dynamic-thumbnail'), 'Project aspect-ratio class missing.');
  }
  foreach (['teaser', 'blog_list'] as $view_mode) {
    $article_node = Node::create(['type' => 'article', 'title' => 'Unsaved dynamic thumbnail test', 'status' => 1, 'field_dynamic_thumbnail' => ['target_id' => $artwork_file->id()]]);
    $article_node->in_preview = TRUE;
    $render_build = \Drupal::entityTypeManager()->getViewBuilder('node')->view($article_node, $view_mode);
    $rendered_markup = (string) \Drupal::service('renderer')->renderRoot($render_build);
    thumbnail_expect(str_contains($rendered_markup, 'data-dynamic-thumbnail'), 'Article without an ordinary image failed: ' . $view_mode);
    $article_node->set('field_dynamic_thumbnail', []);
    $article_node->in_preview = TRUE;
    $render_build = \Drupal::entityTypeManager()->getViewBuilder('node')->view($article_node, $view_mode);
    $rendered_markup = (string) \Drupal::service('renderer')->renderRoot($render_build);
    thumbnail_expect(!str_contains($rendered_markup, 'data-dynamic-thumbnail'), 'Cleared thumbnail must remain cleared.');
  }
} finally {
  $account_switcher->switchBack();
}
echo 'PASS: passive SVG validation, all four Project teasers, Article teaser/blog list without image, and editorial clears.' . PHP_EOL;

$valid_file = \Drupal\file\Entity\File::create(['uri' => $asset_directory . 'roundabout.svg', 'filename' => 'roundabout.svg']);
$validation_errors = \Drupal::service('file.validator')->validate($valid_file, ['DynamicThumbnailSvg' => []]);
thumbnail_expect(count($validation_errors) === 0, 'Upload validator rejected valid layered artwork.');
$unlayered_file = \Drupal\file\Entity\File::create(['uri' => $asset_directory . 'originals/Roudabout-thumnail.svg', 'filename' => 'unlayered.svg']);
$validation_errors = \Drupal::service('file.validator')->validate($unlayered_file, ['DynamicThumbnailSvg' => []]);
thumbnail_expect(count($validation_errors) === 0, 'Upload validator must accept passive flattened artwork.');
echo 'PASS: real Drupal upload validation accepts prepared and flattened SVG.' . PHP_EOL;

$account_switcher->switchTo(\Drupal\user\Entity\User::load(1));
try {
  $article_form = \Drupal::service('entity.form_builder')->getForm(Node::create(['type' => 'article']));
  thumbnail_expect(isset($article_form['field_dynamic_thumbnail']['widget'][0]['#upload_validators']['DynamicThumbnailSvg']), 'Article upload widget must enforce passive SVG validation.');
  $project_form = \Drupal::service('entity.form_builder')->getForm(Node::create(['type' => 'project']));
  thumbnail_expect(isset($project_form['field_dynamic_thumbnail']['widget'][0]['#upload_validators']['DynamicThumbnailSvg']), 'Project upload widget must enforce passive SVG validation.');
  thumbnail_expect($project_form['field_image']['#group'] === 'hero_image_section' && $project_form['field_dynamic_thumbnail']['#group'] === 'hero_image_section', 'Both Project image widgets must share the Hero image section.');
  $project_form_markup = (string) \Drupal::service('renderer')->renderRoot($project_form);
  $form_document = new \DOMDocument();
  @$form_document->loadHTML($project_form_markup);
  $form_xpath = new \DOMXPath($form_document);
  thumbnail_expect($form_xpath->query('//details[@data-drupal-selector="edit-hero-image-section"]//input[contains(@name, "field_image") and @type="file"]')->length === 1, 'Raster upload must render inside Hero image.');
  thumbnail_expect($form_xpath->query('//details[@data-drupal-selector="edit-hero-image-section"]//input[contains(@name, "field_dynamic_thumbnail") and @type="file"]')->length === 1, 'SVG upload must render inside Hero image.');
  $full_project = \Drupal::entityTypeManager()->getStorage('node')->load(27);
  $full_build = \Drupal::entityTypeManager()->getViewBuilder('node')->view($full_project, 'full');
  $full_markup = (string) \Drupal::service('renderer')->renderRoot($full_build);
  thumbnail_expect(!str_contains($full_markup, 'data-dynamic-thumbnail') && str_contains($full_markup, '<img'), 'Detail pages retain the raster image instead of the dynamic preview.');

} finally {
  $account_switcher->switchBack();
}
echo 'PASS: Article and Project forms expose the validated SVG upload.' . PHP_EOL;

$accountia_source = file_get_contents($asset_directory . 'originals/accountia.svg');
$accountia_markup = ThumbnailSvg::prepare($accountia_source, 'accountia-test');
thumbnail_expect($accountia_markup !== NULL, 'The exact supplied Accountia export must be accepted.');
thumbnail_expect(substr_count($accountia_markup, 'data-thumbnail-depth=') === 1, 'Flattened Accountia artwork must move together.');
thumbnail_expect(substr_count($accountia_markup, 'data-thumbnail-highlight=') === 1, 'Detect the raw background radial gradient.');
$accountia_file = \Drupal\file\Entity\File::create(['uri' => $asset_directory . 'originals/accountia.svg', 'filename' => 'accountia.svg']);
thumbnail_expect(count(\Drupal::service('file.validator')->validate($accountia_file, ['DynamicThumbnailSvg' => []])) === 0, 'The actual Accountia upload validator must pass.');
$optional_document = new \DOMDocument();
$optional_document->loadXML(file_get_contents($asset_directory . 'roundabout.svg'));
$optional_xpath = new \DOMXPath($optional_document);
$optional_layer = $optional_xpath->query('//*[@id="level_0"]')->item(0);
$optional_layer->parentNode->removeChild($optional_layer);
$optional_markup = ThumbnailSvg::prepare($optional_document->saveXML(), 'optional-test');
thumbnail_expect($optional_markup !== NULL && substr_count($optional_markup, 'data-thumbnail-depth=') === 2, 'A missing level_0 must be accepted without replacing the other depths.');
thumbnail_expect(ThumbnailSvg::prepare('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 192"><path d="M0 0L10 10"/></svg>', 'plain-test') !== NULL, 'An absent background gradient must be allowed.');
thumbnail_expect(ThumbnailSvg::prepare(str_replace('viewBox="0 0 384 192"', 'viewBox="0 0 384bad 192"', $accountia_source), 'invalid-test') === NULL, 'Malformed geometry must still be rejected.');
echo 'PASS: exact Accountia export, automatic foreground/background, missing depth levels, optional gradient, and geometry validation.' . PHP_EOL;

$flexible_source = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="10 20 600 400"><g id="background"><rect x="10" y="20" width="600" height="400" fill="url(#Paint radial)"/></g><g id="level_0_horizontal"><rect x="-30" y="20" width="680" height="400" fill="navy"/></g><g id="level_1_left" transform="translate(20 30)"><circle cx="120" cy="100" r="30" fill="gold"/></g><g id="level_1_right"><circle cx="350" cy="100" r="30" fill="gold"/></g><g id="level_3"><rect x="100" y="180" width="80" height="60" fill="white"/></g><g id="level_8"><circle cx="300" cy="250" r="30" fill="silver"/></g><g id="level_12"><circle cx="450" cy="300" r="35" fill="orange"/></g><defs><radialGradient id="Paint radial" gradientUnits="userSpaceOnUse" r="1" gradientTransform="translate(10 20) scale(450 200)"><stop stop-color="purple"/><stop offset="1" stop-color="black"/></radialGradient></defs></svg>';
$flexible_markup = ThumbnailSvg::prepare($flexible_source, 'flexible-test');
thumbnail_expect($flexible_markup !== NULL, 'Accept arbitrary positive dimensions, nonzero origin and Figma IDs containing spaces.');
thumbnail_expect(substr_count($flexible_markup, 'data-thumbnail-depth=') === 6, 'Every named group must survive, including gaps and two-digit depths.');
thumbnail_expect(substr_count($flexible_markup, 'data-thumbnail-depth="1"') === 2, 'Same-depth siblings must retain identical depth markers.');
thumbnail_expect(str_contains($flexible_markup, 'class="dynamic-thumbnail__layer--horizontal"'), 'Figma horizontal suffix must set horizontal movement.');
thumbnail_expect(str_contains($flexible_markup, 'transform="translate(20 30)"'), 'Preserve authored transforms inside motion wrappers.');
thumbnail_expect(str_contains($flexible_markup, 'data-thumbnail-highlight'), 'Detect a radial rectangle in the named background group.');
foreach (['0 0 0 400', '0 0 600 -1', '0 0 1e999 400'] as $invalid_viewbox) {
  thumbnail_expect(ThumbnailSvg::prepare(str_replace('10 20 600 400', $invalid_viewbox, $flexible_source), 'invalid-size') === NULL, 'Reject degenerate and nonfinite viewBox dimensions.');
}
file_put_contents(DRUPAL_ROOT . '/../outputs/dynamic-thumbnails/flexible-rendered.svg', $flexible_markup);
echo 'PASS: arbitrary dimensions, origin, depth counts, same-depth siblings, preserved transforms, horizontal naming, background group and invalid geometry.' . PHP_EOL;

$depth_gradient_source = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200"><rect id="level_0" width="400" height="200" fill="url(#artwork-gradient)"/><defs><radialGradient id="artwork-gradient"><stop stop-color="gold"/><stop offset="1" stop-color="black"/></radialGradient></defs></svg>';
$depth_gradient_markup = ThumbnailSvg::prepare($depth_gradient_source, 'depth-gradient');
thumbnail_expect($depth_gradient_markup !== NULL && !str_contains($depth_gradient_markup, 'data-thumbnail-highlight'), 'A radial fill on a depth layer is artwork, not the frame background.');
echo 'PASS: depth-layer gradients never become automatic background highlights.' . PHP_EOL;
