<?php

namespace Drupal\jurenites_component_preview\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/** Allows the local dashboard to frame only explicit local preview responses. */
final class ComponentPreviewSubscriber implements EventSubscriberInterface {

  public static function getSubscribedEvents(): array {
    return [KernelEvents::RESPONSE => ['on_response', -100]];
  }

  public function on_response(ResponseEvent $response_event): void {
    $page_request = $response_event->getRequest();
    if (!$response_event->isMainRequest() || $page_request->getHost() !== 'jurenites.local' || !$page_request->query->has('jurenites_component_preview')) {
      return;
    }
    $page_response = $response_event->getResponse();
    if (!str_contains($page_response->headers->get('Content-Type', ''), 'text/html')) {
      return;
    }
    $page_response->headers->remove('X-Frame-Options');
    $existing_policy = $page_response->headers->get('Content-Security-Policy', '');
    $policy_parts = array_filter(explode(';', $existing_policy), static fn(string $policy_part): bool => trim($policy_part) !== '' && !str_starts_with(trim($policy_part), 'frame-ancestors'));
    $policy_parts[] = "frame-ancestors 'self' http://test.jurenites.local";
    $page_response->headers->set('Content-Security-Policy', implode('; ', $policy_parts));
    $page_response->headers->set('Cache-Control', 'private, no-store');
  }

}
