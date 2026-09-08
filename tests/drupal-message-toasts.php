<?php

/**
 * Run with: docker exec blog_jurenites_web vendor/bin/drush php:script tests/drupal-message-toasts.php
 * Exercises the real messenger/render pipeline without a browser session.
 */

$theme_manager = \Drupal::theme();
$theme_manager->setActiveTheme(\Drupal::service('theme.initialization')->initTheme('jurenites_theme'));
$message_service = \Drupal::messenger();
$message_service->deleteAll();
$message_service->addStatus('Toast status test');
$message_service->addStatus('Second status test');
$message_service->addWarning('Toast warning test');
$message_service->addError(\Drupal\Core\Render\Markup::create('Toast error test <a href="/contact">Contact</a>'));
$render_array = ['#type' => 'status_messages'];
$rendered_html = (string) \Drupal::service('renderer')->renderRoot($render_array);
$html_document = new \DOMDocument();
@$html_document->loadHTML($rendered_html);
$document_query = new \DOMXPath($html_document);
$expected_counts = [
  '//*[@data-drupal-messages]/div[contains(@class, "messages__wrapper")]' => 1,
  '//div[contains(concat(" ", @class, " "), " message-toast ")]' => 4,
  '//div[@role="status"]' => 2,
  '//div[@role="alert"]' => 2,
  '//button[@type="button" and contains(@class, "message-toast__dismiss") and @aria-label]' => 4,
  '//a[@href="/contact"]' => 1,
];
foreach ($expected_counts as $query_text => $expected_count) {
  $actual_count = $document_query->query($query_text)->length;
  if ($actual_count !== $expected_count) {
    throw new \RuntimeException("Expected $expected_count, got $actual_count for $query_text");
  }
}
if ($message_service->all()) {
  throw new \RuntimeException('Rendered messages were not consumed.');
}
print "PASS: PHP messenger renders four dismissible toasts, roles, wrapper and links.\n";
