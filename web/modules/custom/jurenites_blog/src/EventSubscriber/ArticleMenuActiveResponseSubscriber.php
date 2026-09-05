<?php

declare(strict_types=1);

namespace Drupal\jurenites_blog\EventSubscriber;

use Drupal\Core\Routing\CurrentRouteMatch;
use Drupal\node\NodeInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Keeps an Article's owning listing active after response caches are applied.
 */
final class ArticleMenuActiveResponseSubscriber implements EventSubscriberInterface {

  /**
   * Creates the Article menu response subscriber.
   */
  public function __construct(
    private readonly CurrentRouteMatch $currentRouteMatch,
  ) {
  }

  /**
   * Marks Blog or Videos active for the current Article detail response.
   */
  public function onResponse(ResponseEvent $response_event): void {
    $html_response = $response_event->getResponse();
    if (stripos($html_response->headers->get('Content-Type', ''), 'text/html') === FALSE) {
      return;
    }

    $node_entity = $this->currentRouteMatch->getParameter('node');
    if (!$node_entity instanceof NodeInterface
      || $node_entity->bundle() !== 'article') {
      return;
    }

    $response_content = $html_response->getContent();
    if ($response_content === FALSE) {
      return;
    }

    $active_system_path = $node_entity->hasField('field_youtube_video')
      && !$node_entity->get('field_youtube_video')->isEmpty()
        ? 'videos'
        : 'blog';
    $html_response->setContent(static::setArticleMenuActiveClass(
      $response_content,
      $active_system_path,
    ));
  }

  /**
   * Normalizes the active state of the Blog and Videos header links.
   */
  public static function setArticleMenuActiveClass(
    string $html_markup,
    string $active_system_path,
  ): string {
    $updated_markup = preg_replace_callback(
      '/<a\b[^>]*data-drupal-link-system-path="(blog|videos)"[^>]*>/i',
      static function (array $anchor_match) use ($active_system_path): string {
        $anchor_document = new \DOMDocument();
        @$anchor_document->loadHTML(
          '<!DOCTYPE html><html><body>' . $anchor_match[0] . '</body></html>',
        );
        $anchor_element = $anchor_document->getElementsByTagName('a')->item(0);
        if (!$anchor_element instanceof \DOMElement) {
          return $anchor_match[0];
        }

        $class_names = preg_split(
          '/\s+/',
          trim($anchor_element->getAttribute('class')),
          -1,
          PREG_SPLIT_NO_EMPTY,
        ) ?: [];
        if (!in_array('site-header__link', $class_names, TRUE)) {
          return $anchor_match[0];
        }

        $class_names = array_values(array_filter(
          $class_names,
          static fn(string $class_name): bool => $class_name !== 'is-active',
        ));
        $menu_system_path = $anchor_element->getAttribute('data-drupal-link-system-path');
        if ($menu_system_path === $active_system_path) {
          $class_names[] = 'is-active';
          $anchor_element->setAttribute('aria-current', 'page');
        }
        else {
          $anchor_element->removeAttribute('aria-current');
        }
        $anchor_element->setAttribute('class', implode(' ', $class_names));

        $updated_anchor = $anchor_document->saveXML($anchor_element, LIBXML_NOEMPTYTAG);
        if ($updated_anchor === FALSE) {
          return $anchor_match[0];
        }

        return substr($updated_anchor, 0, (int) strrpos($updated_anchor, '<'));
      },
      $html_markup,
    );

    return $updated_markup ?? $html_markup;
  }

  /**
   * {@inheritdoc}
   */
  public static function getSubscribedEvents(): array {
    return [KernelEvents::RESPONSE => ['onResponse', -513]];
  }

}
