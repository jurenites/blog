<?php

namespace Drupal\jurenites_dream_desires\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Url;
use Drupal\jurenites_dream_cards\TopicCatalog;

final class DesireAdminController extends ControllerBase {
  public function overview(): array {
    $desire_storage = $this->entityTypeManager()->getStorage('dream_desire');
    $desire_ids = $desire_storage->getQuery()->accessCheck(FALSE)->sort('id', 'DESC')->pager(25)->execute();
    $status_labels = ['queued' => $this->t('В очереди'), 'generating' => $this->t('Создаётся'), 'ready' => $this->t('Готово'), 'failed' => $this->t('Не завершено')];
    $table_rows = [];
    foreach ($desire_storage->loadMultiple($desire_ids) as $desire_entity) {
      $device_entity = $desire_entity->get('device_id')->entity;
      $status_name = $desire_entity->get('status')->value;
      $image_link = $status_name === 'ready' ? ['data' => ['#type' => 'link', '#title' => $this->t('Изображение'), '#url' => Url::fromRoute('jurenites_dream_desires.image', ['desire_uuid' => $desire_entity->uuid()])]] : '';
      $device_link = $device_entity && $device_entity->get('active')->value ? ['data' => ['#type' => 'link', '#title' => $this->t('Отключить устройство'), '#url' => Url::fromRoute('jurenites_dream_desires.revoke', ['dream_device' => $device_entity->id()])]] : $this->t('Отключено');
      $table_rows[] = [$desire_entity->id(), TopicCatalog::TOPIC_LABELS[$desire_entity->get('topic_key')->value] ?? '', ['data' => ['#plain_text' => $desire_entity->get('desire_text')->value]], $status_labels[$status_name] ?? $status_name, $image_link, $device_link];
    }
    return [
      'settings_link' => ['#type' => 'link', '#title' => $this->t('Настройки генерации'), '#url' => Url::fromRoute('jurenites_dream_desires.settings')],
      'desires_table' => ['#type' => 'table', '#header' => [$this->t('ID'), $this->t('Направление'), $this->t('Мечта'), $this->t('Статус'), $this->t('Изображение'), $this->t('Доступ')], '#rows' => $table_rows, '#empty' => $this->t('Пока нет личных мечтаний.')],
      'pager' => ['#type' => 'pager'], '#cache' => ['max-age' => 0],
    ];
  }
}
