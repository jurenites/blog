<?php

namespace Drupal\jurenites_dream_desires\Plugin\QueueWorker;

use Drupal\Core\Queue\Attribute\QueueWorker;
use Drupal\Core\Queue\QueueWorkerBase;
use Drupal\Core\StringTranslation\TranslatableMarkup;
use Drupal\jurenites_dream_desires\DesireWorkflow;

#[QueueWorker(id: DesireWorkflow::QUEUE_NAME, title: new TranslatableMarkup('Personal dream images'), cron: ['time' => 240])]
final class DesireImageWorker extends QueueWorkerBase {
  public function processItem($queue_data) {
    \Drupal::service('jurenites_dream_desires.workflow')->processDesire((int) $queue_data['desire_id']);
  }
}
