<?php

/**
 * @file
 * Local Drupal integration checks; uses an in-memory provider, never OpenAI.
 * docker exec -e JURENITES_DESIRE_TEST=1 blog_jurenites_web vendor/bin/drush php:script scripts/test-dream-desires.php
 */

use Drupal\Core\Site\Settings;
use Drupal\Core\Session\AnonymousUserSession;
use Drupal\Core\Queue\SuspendQueueException;
use Drupal\jurenites_dream_desires\Controller\DesireApiController;
use Drupal\jurenites_dream_desires\Controller\DesireAdminController;
use Drupal\jurenites_dream_desires\DesireWorkflow;
use Drupal\jurenites_dream_desires\ImageGeneratorInterface;
use Drupal\jurenites_dream_desires\OpenAiImageGenerator;
use Drupal\jurenites_dream_desires\Form\DesireSettingsForm;
use Drupal\jurenites_dream_desires\Entity\DreamDevice;
use Drupal\Core\Form\FormState;
use Symfony\Component\HttpFoundation\Request;
use GuzzleHttp\Client;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Middleware;
use GuzzleHttp\Psr7\Response;

if (getenv('JURENITES_DESIRE_TEST') !== '1' || !is_dir('/opt/drupal') || getenv('DRUPAL_DATABASE_HOST') !== 'db') {
  throw new RuntimeException('Run only in the local Docker test environment with JURENITES_DESIRE_TEST=1.');
}
$check_count = 0;
$assert_check = static function (bool $test_result, string $check_name) use (&$check_count): void {
  if (!$test_result) { throw new RuntimeException($check_name); }
  $check_count++; print "PASS: $check_name\n";
};
$original_settings = Settings::getAll();
$config_storage = \Drupal::configFactory()->getEditable('jurenites_dream_desires.settings');
$original_config = $config_storage->getRawData();
$original_generator = \Drupal::service('jurenites_dream_desires.generator');
$account_switcher = \Drupal::service('account_switcher');
$account_switcher->switchTo(new AnonymousUserSession());
$temporary_directory = '/tmp/dream-desire-check-' . bin2hex(random_bytes(6));
mkdir($temporary_directory, 0700);
$flood_query = \Drupal::database()->select('flood', 'flood_row');
$flood_query->addExpression('MAX(fid)', 'max_id');
$first_flood_id = (int) $flood_query->execute()->fetchField();
$device_tokens = [bin2hex(random_bytes(32)), bin2hex(random_bytes(32))];
$device_ids = [];
$desire_ids = [];
$image_canvas = imagecreatetruecolor(32, 48);
ob_start(); imagejpeg($image_canvas); $fixture_image = ob_get_clean(); imagedestroy($image_canvas);
$fake_generator = new class($fixture_image) implements ImageGeneratorInterface {
  public int $call_count = 0;
  public bool $fail_call = FALSE;
  public string $last_prompt = '';
  public array $last_options = [];
  public function __construct(private string $image_bytes) {}
  public function generateImage(string $prompt_text, string $device_hash, array $model_options): string {
    $this->call_count++; $this->last_prompt = $prompt_text; $this->last_options = $model_options;
    if ($this->fail_call) { throw new RuntimeException('Simulated timeout after remote submission'); }
    return $this->image_bytes;
  }
};
$api_controller = new DesireApiController();
$workflow_service = \Drupal::service('jurenites_dream_desires.workflow');
$request_factory = static function (string $request_method, ?string $device_token, ?array $request_data = NULL): Request {
  $server_values = ['HTTPS' => 'on', 'HTTP_HOST' => 'jurenites.local', 'REMOTE_ADDR' => '192.0.2.59', 'CONTENT_TYPE' => 'application/json'];
  if ($device_token !== NULL) { $server_values['HTTP_AUTHORIZATION'] = 'Bearer ' . $device_token; }
  return Request::create('/api/dream-desires/v1/desires', $request_method, [], [], [], $server_values, $request_data === NULL ? NULL : json_encode($request_data));
};
$read_response = static fn($api_response): array => json_decode($api_response->getContent(), TRUE, 32, JSON_THROW_ON_ERROR);
try {
  new Settings(array_replace($original_settings, ['file_private_path' => $temporary_directory, 'dream_desires_openai_api_key' => 'local-fixture-no-real-key', 'dream_desires_invite_code' => 'fixture-invite-code-long-enough', 'dream_desires_allow_http' => FALSE]));
  $config_storage->set('enabled', TRUE)->set('device_daily_limit', 50)->set('site_daily_limit', 1000)->save();
  \Drupal::getContainer()->set('jurenites_dream_desires.generator', $fake_generator);

  $assert_check($api_controller->createDesire($request_factory('POST', NULL, []))->getStatusCode() === 401, 'Generation requires a device credential');
  $insecure_request = Request::create('http://jurenites.local/api/dream-desires/v1/desires', 'POST');
  $assert_check($api_controller->createDesire($insecure_request)->getStatusCode() === 400, 'Production API rejects HTTP transport');
  $malformed_request = $request_factory('POST', $device_tokens[0], ['invite_code' => 'fixture']);
  $malformed_request->headers->set('Content-Type', 'text/plain');
  $assert_check($api_controller->registerDevice($malformed_request)->getStatusCode() === 415, 'Registration requires JSON content type');
  $bad_invite = $api_controller->registerDevice($request_factory('POST', $device_tokens[0], ['invite_code' => 'wrong']));
  $assert_check($bad_invite->getStatusCode() === 403, 'Invalid invitation cannot provision a device');
  foreach ($device_tokens as $device_token) {
    $registered_response = $api_controller->registerDevice($request_factory('POST', $device_token, ['invite_code' => 'fixture-invite-code-long-enough']));
    $assert_check($registered_response->getStatusCode() === 200, 'Invited device registers successfully: ' . $registered_response->getContent());
    $device_entity = $workflow_service->findDevice($device_token);
    $device_ids[] = (int) $device_entity->id();
    $assert_check($device_entity->get('token_hash')->value !== $device_token && strlen($device_entity->get('token_hash')->value) === 64, 'Only token hash is stored');
  }
  $registered_again = $api_controller->registerDevice($request_factory('POST', $device_tokens[0], ['invite_code' => 'fixture-invite-code-long-enough']));
  $assert_check($registered_again->getStatusCode() === 200, 'Registration retry recovers the same device');
  $request_uuid = \Drupal::service('uuid')->generate();
  $request_data = ['client_request_id' => $request_uuid, 'topic' => 'car', 'desire' => 'Porsche 911 тёмно-синего цвета на берегу озера Комо'];
  $created_response = $api_controller->createDesire($request_factory('POST', $device_tokens[0], $request_data));
  $assert_check($created_response->getStatusCode() === 202, 'Creation returns queued without a paid call: ' . $created_response->getContent());
  $desire_storage = \Drupal::entityTypeManager()->getStorage('dream_desire');
  $desire_items = $desire_storage->loadByProperties(['uuid' => $request_uuid]); $first_desire = reset($desire_items); $desire_ids[] = (int) $first_desire->id();
  $assert_check($fake_generator->call_count === 0, 'HTTP creation does not block on image generation');
  $retry_response = $api_controller->createDesire($request_factory('POST', $device_tokens[0], $request_data));
  $assert_check($read_response($retry_response)['id'] === $request_uuid && $retry_response->getStatusCode() === 202, 'Same request ID reuses the pending desire');
  $changed_data = $request_data; $changed_data['desire'] = 'Другая машина';
  $assert_check($api_controller->createDesire($request_factory('POST', $device_tokens[0], $changed_data))->getStatusCode() === 409, 'Reusing an ID with changed text is rejected');
  $duplicate_data = $request_data; $duplicate_data['client_request_id'] = \Drupal::service('uuid')->generate();
  $assert_check($read_response($api_controller->createDesire($request_factory('POST', $device_tokens[0], $duplicate_data)))['id'] === $request_uuid, 'Identical text with a new ID still reuses the original image record');
  $assert_check($api_controller->readDesire($request_factory('GET', $device_tokens[1]), $request_uuid)->getStatusCode() === 404, 'Other devices cannot read a personal desire');
  $assert_check($api_controller->readImage($request_factory('GET', $device_tokens[1]), $request_uuid)->getStatusCode() === 404, 'Other devices cannot read its image');
  $assert_check($api_controller->createDesire($request_factory('POST', $device_tokens[1], $request_data))->getStatusCode() === 404, 'Other devices cannot take over an existing request ID');
  $invalid_data = $request_data; $invalid_data['topic'] = 'invalid';
  $assert_check($api_controller->createDesire($request_factory('POST', $device_tokens[0], $invalid_data))->getStatusCode() === 400, 'Unknown topic is rejected');
  $invalid_data = $request_data; $invalid_data['desire'] = str_repeat('я', 1001);
  $assert_check($api_controller->createDesire($request_factory('POST', $device_tokens[0], $invalid_data))->getStatusCode() === 400, 'Overlong desire is rejected');
  $invalid_data = $request_data; $invalid_data['model'] = 'client-override';
  $assert_check($api_controller->createDesire($request_factory('POST', $device_tokens[0], $invalid_data))->getStatusCode() === 400, 'Clients cannot override model or generation parameters');
  $assert_check(!$first_desire->access('view', new AnonymousUserSession()), 'Generic anonymous entity access is denied');
  $assert_check($api_controller->readDesire($request_factory('GET', $device_tokens[0]), $request_uuid)->headers->get('Cache-Control') === 'max-age=0, no-store, private', 'Personal JSON is never publicly cached');
  $config_storage->set('enabled', FALSE)->save();
  $suspended_queue = FALSE;
  try { $workflow_service->processDesire((int) $first_desire->id()); } catch (SuspendQueueException $caught_error) { $suspended_queue = TRUE; }
  $assert_check($suspended_queue && $fake_generator->call_count === 0, 'Disabled generation suspends the queue without a provider call');
  $config_storage->set('enabled', TRUE)->save();
  new Settings(array_replace(Settings::getAll(), ['dream_desires_openai_api_key' => '']));
  $missing_key_blocked = FALSE;
  try { $workflow_service->requireReady(); } catch (\Symfony\Component\HttpKernel\Exception\HttpException $caught_error) { $missing_key_blocked = $caught_error->getStatusCode() === 503; }
  $assert_check($missing_key_blocked, 'Missing API key prevents new paid work');
  new Settings(array_replace(Settings::getAll(), ['dream_desires_openai_api_key' => 'local-fixture-no-real-key', 'file_private_path' => DRUPAL_ROOT]));
  $public_storage_blocked = FALSE;
  try { $workflow_service->requireReady(); } catch (\Symfony\Component\HttpKernel\Exception\HttpException $caught_error) { $public_storage_blocked = $caught_error->getStatusCode() === 503; }
  $assert_check($public_storage_blocked, 'Image storage inside the public web root is rejected');
  new Settings(array_replace(Settings::getAll(), ['file_private_path' => $temporary_directory]));
  $worker_plugin = \Drupal::service('plugin.manager.queue_worker')->createInstance(DesireWorkflow::QUEUE_NAME);
  $worker_plugin->processItem(['desire_id' => $first_desire->id()]);
  $ready_response = $api_controller->readDesire($request_factory('GET', $device_tokens[0]), $request_uuid);
  $ready_data = $read_response($ready_response);
  $assert_check($ready_data['status'] === 'ready' && $ready_data['image_url'] !== NULL && $ready_data['image_revision'] !== NULL, 'Worker attaches one private managed file and returns ready');
  $assert_check(str_contains($fake_generator->last_prompt, $request_data['desire']), 'Prompt retains the personal model, color and location');
  $worker_plugin->processItem(['desire_id' => $first_desire->id()]);
  $assert_check($fake_generator->call_count === 1, 'Repeated queue delivery cannot generate a second image');
  $assert_check($api_controller->createDesire($request_factory('POST', $device_tokens[0], $request_data))->getStatusCode() === 200 && $fake_generator->call_count === 1, 'Reopening a completed desire returns its existing image');
  $image_response = $api_controller->readImage($request_factory('GET', $device_tokens[0]), $request_uuid);
  $assert_check($image_response->getStatusCode() === 200 && file_get_contents($image_response->getFile()->getPathname()) === $fixture_image, 'Owner receives stored JPEG bytes');
  $assert_check($image_response->headers->get('Cache-Control') === 'max-age=0, no-store, private', 'Image response is private and noncacheable');
  $assert_check(jurenites_dream_desires_file_download('private://dream-desires/' . $request_uuid . '.jpg') === -1, 'Generic private-file URL cannot bypass owner authorization');

  // Exact provider contract is tested with Guzzle mocks, not a network request.
  $http_history = [];
  $mock_handler = new MockHandler([new Response(200, [], json_encode(['data' => [['b64_json' => base64_encode($fixture_image)]]]))]);
  $handler_stack = HandlerStack::create($mock_handler); $handler_stack->push(Middleware::history($http_history));
  $provider_client = new OpenAiImageGenerator(new Client(['handler' => $handler_stack]));
  $provider_bytes = $provider_client->generateImage('A blue Porsche', 'hashed-device', ['model' => 'gpt-image-1.5', 'size' => '1024x1536', 'quality' => 'medium']);
  $sent_payload = json_decode((string) $http_history[0]['request']->getBody(), TRUE);
  $assert_check($provider_bytes === $fixture_image && $sent_payload['n'] === 1 && $sent_payload['output_format'] === 'jpeg', 'OpenAI request asks for exactly one JPEG and decodes it');
  $assert_check((string) $http_history[0]['request']->getUri() === 'https://api.openai.com/v1/images/generations' && $http_history[0]['options']['allow_redirects'] === FALSE, 'Provider endpoint is fixed and redirects are disabled');
  $mock_handler->append(new Response(200, [], json_encode(['data' => [['b64_json' => base64_encode('not an image')]]])));
  $invalid_image_rejected = FALSE;
  try { $provider_client->generateImage('fixture', 'fixture', ['model' => 'gpt-image-1.5', 'size' => '1024x1536', 'quality' => 'medium']); } catch (RuntimeException $caught_error) { $invalid_image_rejected = TRUE; }
  $assert_check($invalid_image_rejected, 'Invalid provider bytes are not stored as an image');

  $failed_data = ['client_request_id' => \Drupal::service('uuid')->generate(), 'topic' => 'sports', 'desire' => 'Пробежать марафон'];
  $api_controller->createDesire($request_factory('POST', $device_tokens[0], $failed_data));
  $failed_items = $desire_storage->loadByProperties(['uuid' => $failed_data['client_request_id']]); $failed_desire = reset($failed_items); $desire_ids[] = (int) $failed_desire->id();
  $fake_generator->fail_call = TRUE;
  $workflow_service->processDesire((int) $failed_desire->id());
  $workflow_service->processDesire((int) $failed_desire->id());
  $assert_check($fake_generator->call_count === 2 && $read_response($api_controller->readDesire($request_factory('GET', $device_tokens[0]), $failed_desire->uuid()))['status'] === 'failed', 'Provider timeout is terminal and never automatically billed twice');
  $interrupted_data = ['client_request_id' => \Drupal::service('uuid')->generate(), 'topic' => 'travel', 'desire' => 'Увидеть Японию'];
  $api_controller->createDesire($request_factory('POST', $device_tokens[0], $interrupted_data));
  $interrupted_items = $desire_storage->loadByProperties(['uuid' => $interrupted_data['client_request_id']]); $interrupted_desire = reset($interrupted_items); $desire_ids[] = (int) $interrupted_desire->id();
  $interrupted_desire->set('status', 'generating')->save();
  $workflow_service->processDesire((int) $interrupted_desire->id());
  $assert_check($fake_generator->call_count === 2 && $read_response($api_controller->readDesire($request_factory('GET', $device_tokens[0]), $interrupted_desire->uuid()))['error'] === 'generation_interrupted', 'Abandoned in-flight worker never causes a duplicate paid call');
  $config_storage->set('device_daily_limit', 1)->save();
  $limited_data = ['client_request_id' => \Drupal::service('uuid')->generate(), 'topic' => 'home', 'desire' => 'Дом у моря'];
  $assert_check($api_controller->createDesire($request_factory('POST', $device_tokens[0], $limited_data))->getStatusCode() === 429, 'Device generation quota is enforced');
  $assert_check($api_controller->createDesire($request_factory('POST', $device_tokens[0], $request_data))->getStatusCode() === 200, 'Quota does not prevent retrying an existing desire');
  $config_storage->set('site_daily_limit', 1)->save();
  $assert_check($api_controller->createDesire($request_factory('POST', $device_tokens[1], $limited_data))->getStatusCode() === 429, 'Site generation quota covers new devices too');
  $resource_event = new class {
    public bool $disabled_resource = FALSE;
    public function getResourceTypeName() { return 'dream_desire--dream_desire'; }
    public function disableResourceType() { $this->disabled_resource = TRUE; }
  };
  (new \Drupal\jurenites_dream_desires\PrivateResourceSubscriber())->hidePrivateResources($resource_event);
  $assert_check($resource_event->disabled_resource, 'Personal entities are excluded from generic JSON:API resource discovery');
  $form_state = new FormState();
  $settings_form = DesireSettingsForm::create(\Drupal::getContainer())->buildForm([], $form_state);
  $assert_check(isset($settings_form['enabled'], $settings_form['model']) && !isset($settings_form['api_key']), 'Admin settings expose controls without storing a secret in exported config');
  $admin_view = (new DesireAdminController())->overview();
  $assert_check(isset($admin_view['desires_table'], $admin_view['pager']), 'Admin collection lists private desire statuses');
  $file_path = $image_response->getFile()->getPathname();
  $assert_check($api_controller->deleteDesire($request_factory('DELETE', $device_tokens[1]), $request_uuid)->getStatusCode() === 404, 'Another device cannot delete a desire');
  $assert_check($api_controller->deleteDesire($request_factory('DELETE', $device_tokens[0]), $request_uuid)->getStatusCode() === 204 && !file_exists($file_path), 'Owner deletion removes the record and its private image');
  $workflow_service->processDesire((int) $first_desire->id());
  $assert_check($fake_generator->call_count === 2, 'A leftover queue item for a deleted desire does nothing');
  $assert_check($api_controller->deleteDevice($request_factory('DELETE', NULL))->getStatusCode() === 401, 'Device cleanup requires a bearer token');
  $config_storage->set('device_daily_limit', 50)->set('site_daily_limit', 1000)->save();
  $fake_generator->fail_call = FALSE;
  $cleanup_data = ['client_request_id' => \Drupal::service('uuid')->generate(), 'topic' => 'home', 'desire' => 'Светлый дом у моря'];
  $api_controller->createDesire($request_factory('POST', $device_tokens[0], $cleanup_data));
  $cleanup_items = $desire_storage->loadByProperties(['uuid' => $cleanup_data['client_request_id']]); $cleanup_desire = reset($cleanup_items); $desire_ids[] = (int) $cleanup_desire->id();
  $workflow_service->processDesire((int) $cleanup_desire->id());
  $cleanup_image = $api_controller->readImage($request_factory('GET', $device_tokens[0]), $cleanup_desire->uuid())->getFile()->getPathname();
  $other_data = ['client_request_id' => \Drupal::service('uuid')->generate(), 'topic' => 'home', 'desire' => 'Уютная квартира'];
  $api_controller->createDesire($request_factory('POST', $device_tokens[1], $other_data));
  $other_items = $desire_storage->loadByProperties(['uuid' => $other_data['client_request_id']]); $other_desire = reset($other_items); $desire_ids[] = (int) $other_desire->id();
  $assert_check($api_controller->deleteDevice($request_factory('DELETE', $device_tokens[0]))->getStatusCode() === 204 && !$desire_storage->loadByProperties(['device_id' => $device_ids[0]]) && !file_exists($cleanup_image), 'Start-over cleanup deletes all owned desires and image files');
  $assert_check($api_controller->readDesire($request_factory('GET', $device_tokens[1]), $other_desire->uuid())->getStatusCode() === 200, "Start-over cleanup preserves another device's desires");
  $assert_check($api_controller->deleteDevice($request_factory('DELETE', $device_tokens[0]))->getStatusCode() === 204, 'Device cleanup can be repeated after a lost acknowledgement');
  $revoked_device = DreamDevice::load($device_ids[0]); $revoked_device->set('active', FALSE)->save();
  $assert_check($api_controller->readDesire($request_factory('GET', $device_tokens[0]), $failed_desire->uuid())->getStatusCode() === 401, 'Revoked device loses API access');
  $assert_check($api_controller->registerDevice($request_factory('POST', $device_tokens[0], ['invite_code' => 'fixture-invite-code-long-enough']))->getStatusCode() === 403, 'A revoked token cannot register itself again');
  // Optional selfie: separate fingerprint, bounded pixels, explicit consent and cleanup.
  $selfie_data = ['client_request_id' => \Drupal::service('uuid')->generate(), 'topic' => 'sports', 'desire' => 'Мой марафон', 'selfie_base64' => base64_encode($fixture_image . 'private-metadata-fixture')];
  $assert_check($api_controller->createDesire($request_factory('POST', $device_tokens[1], $selfie_data))->getStatusCode() === 400, 'Selfie upload requires explicit consent');
  $selfie_data['selfie_consent'] = TRUE;
  $invalid_selfie = $selfie_data; $invalid_selfie['selfie_base64'] = base64_encode('not a photo');
  $assert_check($api_controller->createDesire($request_factory('POST', $device_tokens[1], $invalid_selfie))->getStatusCode() === 400, 'Invalid selfie bytes are rejected');
  $oversized_selfie = $selfie_data; $oversized_selfie['selfie_base64'] = str_repeat('A', 1400001);
  $assert_check($api_controller->createDesire($request_factory('POST', $device_tokens[1], $oversized_selfie))->getStatusCode() === 413, 'Oversized selfie is rejected');
  $selfie_response = $api_controller->createDesire($request_factory('POST', $device_tokens[1], $selfie_data));
  $assert_check($selfie_response->getStatusCode() === 202, 'Consented selfie queues exactly one personal image');
  $selfie_items = $desire_storage->loadByProperties(['uuid' => $selfie_data['client_request_id']]); $selfie_desire = reset($selfie_items); $desire_ids[] = (int) $selfie_desire->id();
  $reference_file = $selfie_desire->get('reference_file')->entity; $reference_path = $reference_file->getFileUri();
  $assert_check(str_starts_with($reference_path, 'private://dream-desires/') && !str_contains(file_get_contents($reference_path), 'private-metadata-fixture'), 'Selfie is private and re-encoded without metadata');
  $assert_check(!str_contains($selfie_response->getContent(), 'selfie_base64') && !str_contains($selfie_response->getContent(), 'reference_file'), 'API never returns selfie bytes or source file paths');
  $repeat_selfie = $selfie_data; $repeat_selfie['client_request_id'] = \Drupal::service('uuid')->generate();
  $assert_check($read_response($api_controller->createDesire($request_factory('POST', $device_tokens[1], $repeat_selfie)))['id'] === $selfie_desire->uuid(), 'Same desire and selfie deduplicate across request IDs');
  $changed_selfie = $selfie_data; $changed_selfie['selfie_base64'] = base64_encode($fixture_image);
  $assert_check($api_controller->createDesire($request_factory('POST', $device_tokens[1], $changed_selfie))->getStatusCode() === 409, 'Changing the selfie cannot reuse an existing request ID');
  $calls_before = $fake_generator->call_count; $fake_generator->fail_call = FALSE;
  $workflow_service->processDesire((int) $selfie_desire->id());
  $assert_check(isset($fake_generator->last_options['reference_image']) && str_contains($fake_generator->last_prompt, 'Preserve their facial identity'), 'Worker sends the selfie and likeness instruction to the provider');
  $assert_check(!file_exists($reference_path), 'Successful generation removes the server selfie');
  $workflow_service->processDesire((int) $selfie_desire->id());
  $assert_check($fake_generator->call_count === $calls_before + 1, 'Repeated delivery does not regenerate the personalized image');
  $selfie_data['client_request_id'] = \Drupal::service('uuid')->generate(); $selfie_data['desire'] = 'Следующий марафон';
  $api_controller->createDesire($request_factory('POST', $device_tokens[1], $selfie_data));
  $selfie_items = $desire_storage->loadByProperties(['uuid' => $selfie_data['client_request_id']]); $selfie_desire = reset($selfie_items); $desire_ids[] = (int) $selfie_desire->id();
  $reference_path = $selfie_desire->get('reference_file')->entity->getFileUri(); $fake_generator->fail_call = TRUE;
  $workflow_service->processDesire((int) $selfie_desire->id());
  $assert_check(!file_exists($reference_path), 'Failed generation also removes the server selfie');
  $selfie_data['client_request_id'] = \Drupal::service('uuid')->generate(); $selfie_data['desire'] = 'Удалить до обработки';
  $api_controller->createDesire($request_factory('POST', $device_tokens[1], $selfie_data));
  $selfie_items = $desire_storage->loadByProperties(['uuid' => $selfie_data['client_request_id']]); $selfie_desire = reset($selfie_items); $desire_ids[] = (int) $selfie_desire->id();
  $reference_path = $selfie_desire->get('reference_file')->entity->getFileUri();
  $api_controller->deleteDesire($request_factory('DELETE', $device_tokens[1]), $selfie_desire->uuid());
  $assert_check(!file_exists($reference_path), 'Deleting a queued desire deletes its unprocessed selfie');
  $mock_handler->append(new Response(200, [], json_encode(['data' => [['b64_json' => base64_encode($fixture_image)]]])));
  $provider_client->generateImage('Personal marathon', 'hashed-device', ['model' => 'gpt-image-1.5', 'size' => '1024x1536', 'quality' => 'medium', 'reference_image' => $fixture_image]);
  $edit_call = end($http_history); $edit_body = (string) $edit_call['request']->getBody();
  $assert_check((string) $edit_call['request']->getUri() === 'https://api.openai.com/v1/images/edits' && str_contains($edit_body, 'name="image[]"') && str_contains($edit_body, $fixture_image), 'Selfie uses the documented multipart image-edit endpoint');
  $assert_check(str_contains($edit_body, 'name="input_fidelity"') && str_contains($edit_body, "high") && preg_match('/name="n"\r\n(?:[^\r\n]+\r\n)*\r\n1\r\n/', $edit_body) === 1, 'Reference request uses high fidelity and exactly one image');
  print "PASS: $check_count private-desire checks. No real OpenAI calls.\n";
}
finally {
  $desire_storage = \Drupal::entityTypeManager()->getStorage('dream_desire');
  // Discover all fixture rows, even if an assertion failed immediately after creation.
  if ($device_ids) {
    $fixture_ids = $desire_storage->getQuery()->accessCheck(FALSE)->condition('device_id', $device_ids, 'IN')->execute();
    $desire_storage->delete($desire_storage->loadMultiple($fixture_ids));
  }
  foreach ($device_tokens as $device_token) {
    $device_storage = \Drupal::entityTypeManager()->getStorage('dream_device');
    $device_storage->delete($device_storage->loadByProperties(['token_hash' => hash('sha256', $device_token)]));
  }
  $queue_rows = \Drupal::database()->select('queue', 'queue_row')->fields('queue_row', ['item_id', 'data'])->condition('name', DesireWorkflow::QUEUE_NAME)->execute();
  foreach ($queue_rows as $queue_row) {
    $queue_data = unserialize($queue_row->data, ['allowed_classes' => FALSE]);
    if (in_array((int) ($queue_data['desire_id'] ?? 0), $desire_ids, TRUE)) { \Drupal::database()->delete('queue')->condition('item_id', $queue_row->item_id)->execute(); }
  }
  \Drupal::database()->delete('flood')->condition('fid', $first_flood_id, '>')->condition('event', ['dream_desires.register', 'dream_desires.create'], 'IN')->execute();
  \Drupal::getContainer()->set('jurenites_dream_desires.generator', $original_generator);
  $config_storage->setData($original_config)->save();
  \Drupal::service('file_system')->deleteRecursive($temporary_directory);
  new Settings($original_settings);
  $account_switcher->switchBack();
}
