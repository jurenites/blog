<?php
/** Apply reviewed Russian configuration overrides, preserving English config. */
$config_rows = json_decode(file_get_contents(dirname(__DIR__, 2) . '/translations/config.ru.json'), TRUE, 512, JSON_THROW_ON_ERROR);
foreach ($config_rows as $config_row) {
  if (\Drupal::config($config_row['config'])->getOriginal($config_row['path'], FALSE) !== $config_row['en']) {
    throw new \RuntimeException('Configuration source changed: ' . $config_row['config'] . '/' . $config_row['path']);
  }
  $existing_value = \Drupal::languageManager()->getLanguageConfigOverride('ru', $config_row['config'])->get($config_row['path']);
  if ($existing_value !== NULL && $existing_value !== $config_row['en'] && $existing_value !== $config_row['ru']
    && $existing_value !== ($config_row['previous_ru'] ?? NULL)) {
    throw new \RuntimeException('Russian configuration conflict: ' . $config_row['config'] . '/' . $config_row['path']);
  }
}
if (getenv('JURENITES_TRANSLATIONS_APPLY') !== '1') {
  echo 'Validated ' . count($config_rows) . " configuration values; dry run.\n";
  return;
}
foreach ($config_rows as $config_row) {
  $language_override = \Drupal::languageManager()->getLanguageConfigOverride('ru', $config_row['config']);
  $language_override->set($config_row['path'], $config_row['ru'])->save();
}
// Filter language-aware SQL rows to avoid showing both translations in Portfolio.
$portfolio_config = \Drupal::configFactory()->getEditable('views.view.portfolio');
if (!$portfolio_config->get('display.default.display_options.filters.langcode')) {
  $language_filter = \Drupal::config('views.view.guidelines')->get('display.default.display_options.filters.langcode');
  $portfolio_config->set('display.default.display_options.filters.langcode', $language_filter)->save();
}
echo 'Saved ' . count($config_rows) . " Russian configuration values.\n";
