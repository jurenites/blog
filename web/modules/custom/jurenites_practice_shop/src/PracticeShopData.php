<?php

namespace Drupal\jurenites_practice_shop;

use Drupal\Component\Datetime\TimeInterface;
use Drupal\Component\Uuid\UuidInterface;
use Drupal\Core\Database\Connection;
use Drupal\Core\Entity\EntityRepositoryInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;

/**
 * Server-authoritative practice prices, events, and order snapshots.
 */
final class PracticeShopData {

  public const SHIPPING_MINOR = 1000;
  public const MAX_QUANTITY = 10;
  public const EVENT_NAMES = ['session_start', 'view_item_list', 'view_item', 'add_to_cart', 'remove_from_cart', 'view_cart', 'begin_checkout', 'test_purchase'];

  public function __construct(
    private readonly Connection $databaseConnection,
    private readonly UuidInterface $uuidGenerator,
    private readonly TimeInterface $timeService,
    private readonly EntityTypeManagerInterface $entityManager,
    private readonly EntityRepositoryInterface $entityRepository,
  ) {}

  public function productCatalog(): array {
    $block_storage = $this->entityManager->getStorage('block_content');
    $product_ids = $block_storage->getQuery()->accessCheck(FALSE)
      ->condition('type', 'practice_product')->condition('status', 1)->sort('id')->execute();
    $product_catalog = [];
    foreach ($block_storage->loadMultiple($product_ids) as $product_block) {
      $product_block = $this->entityRepository->getTranslationFromContext($product_block);
      $product_price = $product_block->get('field_practice_price')->value;
      $product_kind = $product_block->get('field_practice_kind')->value;
      if ($product_price === NULL || (int) $product_price < 0 || (int) $product_price > 1000000 || !in_array($product_kind, ['digital', 'physical'], TRUE)) {
        continue;
      }
      $product_catalog[(int) $product_block->id()] = [
        'product_id' => (int) $product_block->id(),
        'product_heading' => $product_block->get('field_practice_heading')->value ?? '',
        'product_kind' => $product_kind,
        'price_minor' => (int) $product_price,
        'body_content' => [
          '#type' => 'processed_text', '#text' => $product_block->get('body')->value ?? '',
          '#format' => $product_block->get('body')->format, '#langcode' => $product_block->language()->getId(),
        ],
      ];
    }
    return $product_catalog;
  }

  public function introductionContent(): array {
    $intro_blocks = $this->entityManager->getStorage('block_content')->loadByProperties([
      'uuid' => 'd8a1fbb0-7855-41b4-981f-e27862c27fa3', 'status' => 1,
    ]);
    if (!$intro_blocks) {
      return [];
    }
    $intro_block = $this->entityRepository->getTranslationFromContext(reset($intro_blocks));
    return [
      '#type' => 'processed_text', '#text' => $intro_block->get('body')->value ?? '',
      '#format' => $intro_block->get('body')->format, '#langcode' => $intro_block->language()->getId(),
    ];
  }

  public function cartSummary(array $cart_items): array {
    $product_catalog = $this->productCatalog();
    $product_lines = [];
    $item_total = 0;
    $shipping_total = 0;
    foreach ($cart_items as $product_id => $quantity_value) {
      if (!isset($product_catalog[$product_id]) || !is_int($quantity_value) || $quantity_value < 1 || $quantity_value > self::MAX_QUANTITY) {
        throw new \UnexpectedValueException('A cart product is unavailable or has an invalid quantity.');
      }
      $product_data = $product_catalog[$product_id];
      $line_total = $product_data['price_minor'] * $quantity_value;
      $product_lines[] = array_diff_key($product_data, ['body_content' => TRUE]) + ['quantity_value' => $quantity_value, 'line_value_minor' => $line_total];
      $item_total += $line_total;
      if ($product_data['product_kind'] === 'physical') {
        $shipping_total = self::SHIPPING_MINOR;
      }
    }
    return ['product_lines' => $product_lines, 'item_value_minor' => $item_total, 'shipping_value_minor' => $shipping_total];
  }

  public function recordEvent(string $session_id, string $event_name, array $event_values = []): void {
    if (!in_array($event_name, self::EVENT_NAMES, TRUE) || !\Drupal\Component\Uuid\Uuid::isValid($session_id)) {
      throw new \InvalidArgumentException('Invalid practice event.');
    }
    $allowed_values = array_intersect_key($event_values, array_flip(['product_id', 'quantity_value', 'order_id', 'item_value_minor', 'shipping_value_minor']));
    $this->databaseConnection->insert('jurenites_practice_event')->fields($allowed_values + [
      'session_id' => $session_id, 'event_name' => $event_name, 'created_at' => $this->timeService->getCurrentTime(),
    ])->execute();
  }

  public function newIdentifier(): string {
    return $this->uuidGenerator->generate();
  }

  public function loadOrder(string $order_id, string $session_id): ?array {
    $order_record = $this->databaseConnection->select('jurenites_practice_order', 'practice_order')
      ->fields('practice_order')->condition('order_id', $order_id)->condition('session_id', $session_id)
      ->execute()->fetchAssoc();
    return $order_record ?: NULL;
  }

  public function completeOrder(string $order_id, string $session_id, array $cart_items, string $quote_signature): array {
    if (!\Drupal\Component\Uuid\Uuid::isValid($order_id) || !\Drupal\Component\Uuid\Uuid::isValid($session_id)) {
      throw new \InvalidArgumentException('Invalid practice order.');
    }
    // Replayed submissions return the original immutable order.
    if ($existing_order = $this->loadOrder($order_id, $session_id)) {
      return $existing_order;
    }
    $cart_summary = $this->cartSummary($cart_items);
    if (!$cart_summary['product_lines'] || !hash_equals($quote_signature, $this->quoteSignature($cart_summary))) {
      throw new \UnexpectedValueException('The cart changed. Review the current prices before placing a test order.');
    }
    $order_record = [
      'order_id' => $order_id, 'session_id' => $session_id, 'created_at' => $this->timeService->getCurrentTime(),
      'item_value_minor' => $cart_summary['item_value_minor'], 'shipping_value_minor' => $cart_summary['shipping_value_minor'],
      'product_lines' => json_encode($cart_summary['product_lines'], JSON_THROW_ON_ERROR),
    ];
    $database_transaction = $this->databaseConnection->startTransaction();
    try {
      $this->databaseConnection->insert('jurenites_practice_order')->fields($order_record)->execute();
      $this->recordEvent($session_id, 'test_purchase', [
        'order_id' => $order_id, 'item_value_minor' => $cart_summary['item_value_minor'],
        'shipping_value_minor' => $cart_summary['shipping_value_minor'],
      ]);
    }
    catch (\Throwable $database_error) {
      $database_transaction->rollBack();
      throw $database_error;
    }
    unset($database_transaction);
    return $order_record;
  }

  public function quoteSignature(array $cart_summary): string {
    return hash('sha256', json_encode($cart_summary, JSON_THROW_ON_ERROR));
  }

}
