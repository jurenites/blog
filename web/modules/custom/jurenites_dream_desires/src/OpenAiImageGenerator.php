<?php

namespace Drupal\jurenites_dream_desires;

use Drupal\Core\Site\Settings;
use GuzzleHttp\ClientInterface;

/** One Images API request, no automatic retries and no remote URL downloads. */
final class OpenAiImageGenerator implements ImageGeneratorInterface {
  public function __construct(private readonly ClientInterface $http_client) {}

  public static function apiKey(): string {
    return trim((string) Settings::get('dream_desires_openai_api_key', getenv('OPENAI_API_KEY') ?: ''));
  }

  public function generateImage(string $prompt_text, string $device_hash, array $model_options): string {
    $api_key = self::apiKey();
    if ($api_key === '') {
      throw new \RuntimeException('provider_not_configured');
    }
    $request_payload = [
      'model' => $model_options['model'], 'prompt' => $prompt_text, 'n' => 1,
      'size' => $model_options['size'], 'quality' => $model_options['quality'],
      'output_format' => 'jpeg', 'output_compression' => 85, 'user' => $device_hash,
    ];
    $request_options = [
      'headers' => ['Authorization' => 'Bearer ' . $api_key, 'Accept' => 'application/json'],
      'connect_timeout' => 10, 'timeout' => 180, 'allow_redirects' => FALSE, 'http_errors' => FALSE,
    ];
    $endpoint_path = 'generations';
    if (isset($model_options['reference_image'])) {
      $endpoint_path = 'edits';
      if (str_starts_with($model_options['model'], 'gpt-image-1.5')) { $request_payload['input_fidelity'] = 'high'; }
      $request_parts = [];
      foreach ($request_payload as $field_name => $field_value) {
        $request_parts[] = ['name' => $field_name, 'contents' => (string) $field_value];
      }
      $request_parts[] = ['name' => 'image[]', 'contents' => $model_options['reference_image'], 'filename' => 'selfie.jpg', 'headers' => ['Content-Type' => 'image/jpeg']];
      $request_options['multipart'] = $request_parts;
    }
    else { $request_options['json'] = $request_payload; }
    $api_response = $this->http_client->request('POST', 'https://api.openai.com/v1/images/' . $endpoint_path, $request_options);
    if ($api_response->getStatusCode() !== 200) {
      // Do not log provider bodies: they can contain prompts or sensitive details.
      throw new \RuntimeException('provider_http_' . $api_response->getStatusCode());
    }
    $response_body = $api_response->getBody();
    $json_text = '';
    while (!$response_body->eof()) {
      $json_text .= $response_body->read(65536);
      if (strlen($json_text) > 12 * 1024 * 1024) {
        throw new \RuntimeException('provider_response_too_large');
      }
    }
    $image_data = json_decode($json_text, TRUE, 32, JSON_THROW_ON_ERROR);
    if (count($image_data['data'] ?? []) !== 1 || !is_string($image_data['data'][0]['b64_json'] ?? NULL)) {
      throw new \RuntimeException('provider_invalid_image');
    }
    $image_bytes = base64_decode($image_data['data'][0]['b64_json'], TRUE);
    $image_info = $image_bytes === FALSE ? FALSE : @getimagesizefromstring($image_bytes);
    if (!$image_info || $image_info['mime'] !== 'image/jpeg' || strlen($image_bytes) > 8 * 1024 * 1024 || $image_info[0] * $image_info[1] > 5000000) {
      throw new \RuntimeException('provider_invalid_image');
    }
    return $image_bytes;
  }
}
