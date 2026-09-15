<?php

namespace Drupal\jurenites_qr_studio\Controller;

use Drupal\Component\Utility\Crypt;
use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Render\AttachmentsResponseProcessorInterface;
use Drupal\Core\Render\HtmlResponse;
use Drupal\Core\Render\RendererInterface;
use Drupal\Core\Url;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Serves an isolated app document with Drupal-managed library attachments.
 */
final class QrStudioController extends ControllerBase {

  public function __construct(
    private readonly RendererInterface $page_renderer,
    private readonly AttachmentsResponseProcessorInterface $attachment_processor,
  ) {}

  public static function create(ContainerInterface $service_container): static {
    return new static(
      $service_container->get('renderer'),
      $service_container->get('html_response.attachments_processor'),
    );
  }

  public function workspacePage(): HtmlResponse {
    $placeholder_token = Crypt::randomBytesBase64(55);
    $module_path = $this->moduleHandler()->getModule('jurenites_qr_studio')->getPath();
    $page_document = [
      '#theme' => 'jurenites_qr_studio_document',
      '#placeholder_token' => $placeholder_token,
      '#studio_url' => Url::fromRoute('jurenites_qr_studio.workspace')->toString(),
      '#website_url' => Url::fromRoute('<front>')->toString(),
      '#favicon_url' => base_path() . $module_path . '/ui/favicon.svg',
      '#attached' => ['library' => ['jurenites_qr_studio/workspace']],
      '#cache' => ['contexts' => ['url.site', 'languages:language_url']],
    ];
    foreach (['styles' => 'css', 'scripts' => 'js', 'scripts_bottom' => 'js-bottom'] as $attachment_name => $placeholder_name) {
      $page_document['#attached']['html_response_attachment_placeholders'][$attachment_name] = '<' . $placeholder_name . '-placeholder token="' . $placeholder_token . '">';
    }
    $this->page_renderer->renderRoot($page_document);
    $page_response = new HtmlResponse($page_document);
    return $this->attachment_processor->processAttachments($page_response);
  }

}
