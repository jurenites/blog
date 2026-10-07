<?php

/**
 * @file
 * Run locally: drush php:script tests/practice-shop-integration.php.
 * All database changes made by this test are rolled back.
 */

use Drupal\Core\Session\AnonymousUserSession;
use Drupal\jurenites_practice_shop\Controller\PracticeExportController;
use Drupal\jurenites_practice_shop\PracticeShopData;

function assert_practice_result(bool $test_result, string $test_message): void {
  if (!$test_result) {
    throw new RuntimeException($test_message);
  }
}

$database_connection = \Drupal::database();
$test_transaction = $database_connection->startTransaction();
$shop_data = \Drupal::service('jurenites_practice_shop.data');
$session_id = $shop_data->newIdentifier();
$product_catalog = $shop_data->productCatalog();
$digital_products = array_filter($product_catalog, static fn(array $product_data): bool => $product_data['product_kind'] === 'digital');
$physical_products = array_filter($product_catalog, static fn(array $product_data): bool => $product_data['product_kind'] === 'physical');
$digital_id = array_key_first($digital_products);
$physical_id = array_key_first($physical_products);
assert_practice_result($digital_id !== NULL && $physical_id !== NULL, 'Need both demo product types.');

try {
  $digital_summary = $shop_data->cartSummary([$digital_id => 2]);
  assert_practice_result($digital_summary['shipping_value_minor'] === 0, 'Digital carts must have no shipping.');
  $mixed_cart = [$digital_id => 1, $physical_id => 2];
  $mixed_summary = $shop_data->cartSummary($mixed_cart);
  assert_practice_result($mixed_summary['shipping_value_minor'] === PracticeShopData::SHIPPING_MINOR, 'Physical shipping must be charged once per test order.');
  assert_practice_result($mixed_summary['item_value_minor'] === $product_catalog[$digital_id]['price_minor'] + 2 * $product_catalog[$physical_id]['price_minor'], 'Totals must use server prices.');

  foreach ([[$digital_id => -1], [$digital_id => 11], [$digital_id => '1'], [PHP_INT_MAX => 1]] as $invalid_cart) {
    try {
      $shop_data->cartSummary($invalid_cart);
      throw new RuntimeException('Invalid cart was accepted.');
    }
    catch (UnexpectedValueException) {}
  }
  $quote_signature = $shop_data->quoteSignature($mixed_summary);
  $order_id = $shop_data->newIdentifier();
  $order_record = $shop_data->completeOrder($order_id, $session_id, $mixed_cart, $quote_signature);
  $replayed_order = $shop_data->completeOrder($order_id, $session_id, [], '');
  assert_practice_result($order_record['order_id'] === $replayed_order['order_id'], 'Duplicate submission changed the order.');
  $purchase_count = $database_connection->select('jurenites_practice_event', 'practice_event')->condition('order_id', $order_id)->condition('event_name', 'test_purchase')->countQuery()->execute()->fetchField();
  assert_practice_result((int) $purchase_count === 1, 'Duplicate submission created a second purchase event.');
  assert_practice_result($shop_data->loadOrder($order_id, $shop_data->newIdentifier()) === NULL, 'Another session can read the order.');

  $product_storage = \Drupal::entityTypeManager()->getStorage('block_content');
  $changed_product = $product_storage->load($digital_id);
  $changed_product->set('field_practice_price', $product_catalog[$digital_id]['price_minor'] + 100)->save();
  try {
    $shop_data->completeOrder($shop_data->newIdentifier(), $session_id, $mixed_cart, $quote_signature);
    throw new RuntimeException('Checkout accepted a stale price quote.');
  }
  catch (UnexpectedValueException) {}
  $changed_product->set('status', FALSE)->save();
  assert_practice_result(!isset($shop_data->productCatalog()[$digital_id]), 'Unpublished product is in the catalog.');

  $anonymous_account = new AnonymousUserSession();
  foreach (['events', 'orders'] as $dataset_name) {
    $export_access = \Drupal::service('access_manager')->checkNamedRoute('jurenites_practice_shop.export', ['dataset_name' => $dataset_name], $anonymous_account, TRUE);
    assert_practice_result(!$export_access->isAllowed(), 'Anonymous CSV export is allowed.');
    $export_response = (new PracticeExportController())->exportData($dataset_name);
    ob_start();
    $export_response->sendContent();
    $csv_output = ob_get_clean();
    assert_practice_result(str_contains($csv_output, 'data_origin,value_unit,occurred_at_utc,event_date'), 'CSV schema missing.');
    assert_practice_result(str_contains($csv_output, 'practice,test_credit_minor,'), 'CSV is missing test-data labels.');
    assert_practice_result(str_contains($csv_output, $order_id), 'Saved test order not exported.');
    assert_practice_result(!str_contains($csv_output, 'product_lines') && !str_contains($csv_output, 'email'), 'Unexpected fields exposed in CSV.');
    assert_practice_result(str_contains($export_response->headers->get('Cache-Control'), 'no-store'), 'CSV response can be cached.');
  }
  echo "PASS: server prices, digital/physical shipping, invalid quantities, idempotent orders, session isolation, stale quotes, unpublished products, private labeled CSV exports.\n";
}
finally {
  $test_transaction->rollBack();
  \Drupal::entityTypeManager()->getStorage('block_content')->resetCache();
}
