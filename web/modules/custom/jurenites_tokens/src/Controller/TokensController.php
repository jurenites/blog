<?php

namespace Drupal\jurenites_tokens\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\JsonResponse;

final class TokensController extends ControllerBase {

  public function records(): JsonResponse {
    $tokens_path = DRUPAL_ROOT . '/../generated/token/tokens.js';

    if (!is_readable($tokens_path)) {
      return new JsonResponse([
        'error' => 'generated/token/tokens.js is not readable.',
      ], 404);
    }

    $tokens_source = (string) file_get_contents($tokens_path);
    $records_match = [];

    preg_match('/export const TOKEN_RECORDS = (\[.*?\]);\s*export const TOKEN_VALUES/s', $tokens_source, $records_match);

    if (!isset($records_match[1])) {
      return new JsonResponse([
        'error' => 'generated/token/tokens.js does not contain TOKEN_RECORDS.',
      ], 500);
    }

    $token_records = json_decode($records_match[1], TRUE);

    if (!is_array($token_records)) {
      return new JsonResponse([
        'error' => 'generated/token/tokens.js TOKEN_RECORDS is not valid JSON.',
      ], 500);
    }

    $token_values = [];
    foreach ($token_records as $token_record) {
      if (is_array($token_record) && isset($token_record['name'], $token_record['css_value'])) {
        $token_values[$token_record['name']] = $token_record['css_value'];
      }
    }

    return new JsonResponse([
      'records' => $token_records,
      'values' => $token_values,
    ]);
  }

}
