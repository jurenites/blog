<?php

/** Reorder existing Home previews and seed an editable Russian translation once. */
$preview_block = \Drupal\block_content\Entity\BlockContent::load(34);
if (!$preview_block || $preview_block->uuid() !== 'd70557b9-7e26-436a-9201-459375bd81f2') {
  throw new RuntimeException('Expected Home preview block not found.');
}
$update_key = 'jurenites.home_preview_russian_layout_v1';
if (\Drupal::state()->get($update_key)) {
  echo "Home preview update already applied; CMS edits preserved.\n";
  return;
}
$russian_summaries = [
  'Accountia' => 'Система учёта для арабоязычного бизнеса: товары, склады, договоры купли-продажи.',
  'ScatchApp' => 'Воплощение идей сооснователя приложения для поиска событий и покупки билетов в экранах Figma. Основное внимание — навигации, поиску событий и фильтрации.',
  'Dzing' => 'Координация разработки мобильного приложения Dzing Finance, уточнение требований совместно с продуктовой и инженерной командами и адаптация приложения для трёх партнёрских брендов.',
  'SMEP' => 'Мой личный проект инкрементальной игры, начатый в августе 2019 года: исследование частиц, химии и возникновения сложной материи через игру.',
];
$russian_labels = [
  'Project previews' => 'Обзоры проектов',
  'ScatchApp map and event list design recording' => 'ScatchApp: запись интерфейса карты и списка событий',
  'ScatchApp event filter design recording' => 'ScatchApp: запись интерфейса фильтра событий',
  'Dzing: registration' => 'Dzing: регистрация',
  'Dzing: registration 5' => 'Dzing: регистрация, шаг 5',
  'Dzing: profile-form' => 'Dzing: форма профиля',
  'Dzing: menu' => 'Dzing: меню',
  'Dzing: subscriptions' => 'Dzing: подписки',
  'Dzing: Card name select, entered' => 'Dzing: ввод названия карты',
  'Dzing: Transaction Mobile top up' => 'Dzing: пополнение мобильного телефона',
  'Dzing: terms of use' => 'Dzing: условия использования',
  'Dashboard Mobile' => 'Accountia: мобильная панель управления',
  'Bulk Payment from Dialog box, Mobile' => 'Accountia: диалог массового платежа',
  'Company Settings form, Documents tab, Mobile page' => 'Accountia: настройки компании, документы',
  'Company Settings form, Event log tab, daterange picker, Mobile page' => 'Accountia: журнал событий, выбор периода',
  'Company Settings form, Inventory tab, Mobile page' => 'Accountia: настройки складского учёта',
  'Company Settings form, Tempalte tab, Mobile page' => 'Accountia: настройки шаблонов',
  'Employee list, Mobile page' => 'Accountia: список сотрудников',
  'Fees full form, Mobile-wider page' => 'Accountia: форма сборов',
  'Installment create, form Mobile page' => 'Accountia: оформление рассрочки',
  'Invoice, Confirm Cancel invoce, Dialog box, Mobile view' => 'Accountia: подтверждение отмены счёта',
  'Product form filled, Prodcut Tab, Mobile page' => 'Accountia: заполненная форма товара',
  'Send mail Invoice form, Dialog box full Mobile page' => 'Accountia: отправка счёта по электронной почте',
  'Suppliers form full, Mobile page' => 'Accountia: форма поставщика',
  'Transfer Create form filled, Mobile page' => 'Accountia: заполненная форма перевода',
  'SMEP: Card view-electron' => 'SMEP: карточка электрона',
  'SMEP: Card view-pion' => 'SMEP: карточка пиона',
  'SMEP: Card view-Proton' => 'SMEP: карточка протона',
  'SMEP: Detail view, 2. Atomic, Oganesson Isotope' => 'SMEP: подробности об изотопе оганесона',
  'SMEP: Detail view, 2. Atomic, Oganesson Periodic' => 'SMEP: оганесон в периодической таблице',
  'SMEP: Fields list (option A), selected' => 'SMEP: список областей, вариант A, выбранный элемент',
  'SMEP: Fields list (option B), selected' => 'SMEP: список областей, вариант B, выбранный элемент',
  'SMEP: Research list (optin B) ,focus' => 'SMEP: список исследований, вариант B, фокус',
  'SMEP: Research list (optin B), researching' => 'SMEP: список исследований, вариант B, исследование в процессе',
  'SMEP: Research list (option D)' => 'SMEP: список исследований, вариант D',
];
foreach (range(1, 5) as $card_number) {
  $russian_labels['SMEP: Card view ' . $card_number] = 'SMEP: карточка ' . $card_number;
}
foreach (array_keys($russian_summaries) as $project_heading) {
  $russian_labels['Read ' . $project_heading] = 'О проекте ' . $project_heading;
}
$has_russian = $preview_block->hasTranslation('ru');
if (!$has_russian) {
  $preview_block->addTranslation('ru', $preview_block->toArray());
}
foreach ($preview_block->getTranslationLanguages() as $language_code => $language_object) {
  $block_translation = $preview_block->getTranslation($language_code);
  $html_document = \Drupal\Component\Utility\Html::load($block_translation->body->value);
  $xpath_query = new DOMXPath($html_document);
  $track_element = $xpath_query->query('//*[@data-project-track]')->item(0);
  if (!$track_element) {
    throw new RuntimeException('Expected an existing project slider.');
  }
  foreach ($xpath_query->query('//*[@data-project-slide]') as $slide_element) {
    $copy_element = $xpath_query->query('./div[contains(@class, "project-case-preview__copy")]', $slide_element)->item(0);
    $phone_element = $xpath_query->query('./a[contains(concat(" ", normalize-space(@class), " "), " card ")]', $slide_element)->item(0);
    $heading_element = $xpath_query->query('.//h2', $copy_element)->item(0);
    $project_heading = $heading_element->textContent;
    if (!$phone_element || !isset($russian_summaries[$project_heading])) {
      throw new RuntimeException('Unexpected project preview structure.');
    }
    $slide_element->insertBefore($phone_element, $copy_element);
    if ($project_heading === 'Accountia') {
      $track_element->insertBefore($slide_element, $track_element->firstChild);
    }
    if ($language_code === 'ru' && !$has_russian) {
      $xpath_query->query('./p', $copy_element)->item(0)->textContent = $russian_summaries[$project_heading];
      $xpath_query->query('.//a', $copy_element)->item(0)->textContent = 'Подробнее о проекте';
    }
  }
  if ($language_code === 'ru' && !$has_russian) {
    foreach ($xpath_query->query('//*[@aria-label or @alt or @title]') as $html_element) {
      foreach (['aria-label', 'alt', 'title'] as $attribute_name) {
        $attribute_value = $html_element->getAttribute($attribute_name);
        if (isset($russian_labels[$attribute_value])) {
          $html_element->setAttribute($attribute_name, $russian_labels[$attribute_value]);
        }
      }
    }
    foreach ($xpath_query->query('//a[@href]') as $link_element) {
      $link_path = $link_element->getAttribute('href');
      if (str_starts_with($link_path, '/portfolio/')) {
        $link_element->setAttribute('href', '/ru' . $link_path);
      }
    }
    $xpath_query->query('//*[@data-project-previous]')->item(0)->textContent = 'Назад';
    $xpath_query->query('//*[@data-project-next]')->item(0)->textContent = 'Далее';
    $block_translation->setInfo('Обзоры проектов на главной');
    $block_translation->content_translation_source = 'en';
  }
  $block_translation->body->value = \Drupal\Component\Utility\Html::serialize($html_document);
}
$preview_block->setNewRevision(TRUE);
$preview_block->setRevisionLogMessage('Show Accountia first, place phone previews before descriptions and add Russian Home preview content.');
$preview_block->save();
\Drupal::state()->set($update_key, TRUE);
echo 'Updated Home preview block, revision ' . $preview_block->getRevisionId() . PHP_EOL;
