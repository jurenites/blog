<?php

namespace Drupal\jurenites_tokens\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\JsonResponse;

final class TokensController extends ControllerBase {

  public function json(): JsonResponse {
    $tokens_path = DRUPAL_ROOT . '/../tokens/tokens.json';

    if (!is_readable($tokens_path)) {
      return new JsonResponse([
        'error' => 'tokens/tokens.json is not readable.',
      ], 404);
    }

    $tokens = json_decode((string) file_get_contents($tokens_path), TRUE);

    if (!is_array($tokens)) {
      return new JsonResponse([
        'error' => 'tokens/tokens.json is not valid JSON.',
      ], 500);
    }

    return new JsonResponse($tokens);
  }

}
