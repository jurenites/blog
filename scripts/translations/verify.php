<?php
/** Verify saved translations and anonymous local pages without submitting forms. */
$catalogue_root = dirname(__DIR__, 2) . '/translations';
$content_rows = json_decode(file_get_contents($catalogue_root . '/content.ru.json'), TRUE, 512, JSON_THROW_ON_ERROR);
$config_rows = json_decode(file_get_contents($catalogue_root . '/config.ru.json'), TRUE, 512, JSON_THROW_ON_ERROR);
$interface_rows = json_decode(file_get_contents($catalogue_root . '/interface.ru.json'), TRUE, 512, JSON_THROW_ON_ERROR);
$verified_entities = [];
foreach ($content_rows as $content_row) {
  $source_entity = \Drupal::service('entity.repository')->loadEntityByUuid($content_row['entity_type'], $content_row['uuid'])->getUntranslated();
  foreach (['en', 'ru'] as $language_code) {
    $translated_entity = $source_entity->getTranslation($language_code);
    $actual_text = $translated_entity->get($content_row['field'])->getValue()[$content_row['delta']][$content_row['property']] ?? NULL;
    if ($actual_text !== $content_row[$language_code]) {
      throw new \RuntimeException("Mismatch: $language_code / {$content_row['uuid']} / {$content_row['field']}");
    }
  }
  $verified_entities[$content_row['uuid']] = $source_entity;
}
foreach ($config_rows as $config_row) {
  $actual_text = \Drupal::languageManager()->getLanguageConfigOverride('ru', $config_row['config'])->get($config_row['path']);
  if ($actual_text !== $config_row['ru']) {
    throw new \RuntimeException('Configuration mismatch: ' . $config_row['config']);
  }
}
foreach ($interface_rows as $interface_row) {
  $translated_string = \Drupal::service('locale.storage')->findTranslation(['source' => $interface_row['en'], 'context' => $interface_row['context'], 'language' => 'ru']);
  if (!$translated_string || $translated_string->getString() !== $interface_row['ru']) {
    throw new \RuntimeException('Interface mismatch: ' . $interface_row['en']);
  }
}
$page_checks = [
  '/' => ['Let’s build something together.', 'Latest articles'],
  '/ru' => ['Давайте создадим что-нибудь вместе.', 'Последние статьи', 'Этот сайт НЕ использует cookie.'],
  '/ru/contact' => ['Введите тему', 'Введите ваше имя', 'Введите сообщение', 'Отправить'],
  '/ru/portfolio' => ['Портфолио', 'Roundabout', '4pixel'],
  '/ru/portfolio?tag=font' => ['Roundabout', '4pixel'],
  '/ru/blog?tag=ui-ux-design' => ['Обзор интерфейсов'],
  '/ru/videos?tag=game-dev' => ['Разработка игр'],
  '/ru/cookbook' => ['Рецепт: превратить идею в компонент'],
  '/ru/guidelines' => ['Значок логотипа', 'Цвет'],
  '/ru/timeline' => ['Хронология', 'День рождения моей дочери'],
  '/ru/portfolio/4pixel' => ['Сегодня я использую 4pixel', 'Скачать шрифт'],
  '/ru/portfolio/roundabout' => ['Roundabout появился', 'Скачать шрифт'],
];
foreach ($page_checks as $page_path => $expected_strings) {
  $page_response = \Drupal::httpClient()->get('http://localhost' . $page_path, ['headers' => ['Host' => 'jurenites.local'], 'http_errors' => FALSE]);
  $page_html = (string) $page_response->getBody();
  if ($page_response->getStatusCode() !== 200) {
    throw new \RuntimeException('HTTP failure: ' . $page_path);
  }
  foreach ($expected_strings as $expected_text) {
    if (!str_contains(html_entity_decode($page_html, ENT_QUOTES | ENT_HTML5, 'UTF-8'), $expected_text)) {
      throw new \RuntimeException("Rendered text missing on $page_path: $expected_text");
    }
  }
  if (str_starts_with($page_path, '/ru') && !str_contains($page_html, 'lang="ru"')) {
    throw new \RuntimeException('Wrong document language: ' . $page_path);
  }
  echo "HTTP 200 and expected text: $page_path\n";
}
echo 'Verified ' . count($content_rows) . ' EN/RU field pairs, ' . count($config_rows) . ' configuration overrides, ' . count($interface_rows) . " interface strings.\n";
