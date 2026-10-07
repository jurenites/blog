<?php

namespace Drupal\jurenites_practice_shop\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Url;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Private exports with explicit practice labels and UTC dates.
 */
final class PracticeExportController extends ControllerBase {

  public function reportLinks(): array {
    return [
      'report_note' => ['#markup' => '<p>' . $this->t('Test data only. Amounts use test credits, not money. Orders export one row per order; events export one row per action. Data older than 90 days is removed by cron.') . '</p>'],
      'events_link' => ['#type' => 'link', '#title' => $this->t('Download events CSV'), '#url' => Url::fromRoute('jurenites_practice_shop.export', ['dataset_name' => 'events']), '#suffix' => '<br>'],
      'orders_link' => ['#type' => 'link', '#title' => $this->t('Download test orders CSV'), '#url' => Url::fromRoute('jurenites_practice_shop.export', ['dataset_name' => 'orders'])],
    ];
  }

  public function exportData(string $dataset_name): StreamedResponse {
    $table_names = ['events' => 'jurenites_practice_event', 'orders' => 'jurenites_practice_order'];
    if (!isset($table_names[$dataset_name])) {
      throw new NotFoundHttpException();
    }
    $database_connection = \Drupal::database();
    $field_names = $dataset_name === 'events'
      ? ['event_id', 'session_id', 'event_name', 'product_id', 'quantity_value', 'order_id', 'item_value_minor', 'shipping_value_minor']
      : ['order_id', 'session_id', 'item_value_minor', 'shipping_value_minor'];
    return new StreamedResponse(static function () use ($database_connection, $table_names, $dataset_name, $field_names): void {
      $output_stream = fopen('php://output', 'wb');
      fputcsv($output_stream, array_merge(['data_origin', 'value_unit', 'occurred_at_utc', 'event_date'], $field_names), ',', '"', '');
      $row_results = $database_connection->select($table_names[$dataset_name], 'practice_data')
        ->fields('practice_data', array_merge(['created_at'], $field_names))
        ->orderBy('created_at')->orderBy($dataset_name === 'events' ? 'event_id' : 'order_id')->execute();
      foreach ($row_results as $data_row) {
        // Only server-generated IDs, allowlisted event names, and numbers are exported.
        // Editable rich text, names, credentials, and addresses are never included.
        $row_values = ['practice', 'test_credit_minor', gmdate('Y-m-d\TH:i:s\Z', (int) $data_row->created_at), gmdate('Y-m-d', (int) $data_row->created_at)];
        foreach ($field_names as $field_name) {
          $row_values[] = $data_row->{$field_name};
        }
        fputcsv($output_stream, $row_values, ',', '"', '');
      }
      fclose($output_stream);
    }, 200, [
      'Content-Type' => 'text/csv; charset=UTF-8',
      'Content-Disposition' => 'attachment; filename="practice-shop-' . $dataset_name . '.csv"',
      'Cache-Control' => 'private, no-store',
      'X-Content-Type-Options' => 'nosniff',
    ]);
  }

}
