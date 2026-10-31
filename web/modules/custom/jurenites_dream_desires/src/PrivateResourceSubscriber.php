<?php

namespace Drupal\jurenites_dream_desires;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;

/** Also hide these resource types if core JSON:API is enabled later. */
final class PrivateResourceSubscriber implements EventSubscriberInterface {
  public static function getSubscribedEvents(): array {
    return ['jsonapi.resource_type.build' => 'hidePrivateResources'];
  }

  public function hidePrivateResources($build_event): void {
    if (in_array($build_event->getResourceTypeName(), ['dream_device--dream_device', 'dream_desire--dream_desire'], TRUE)) {
      $build_event->disableResourceType();
    }
  }
}
