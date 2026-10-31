<?php

namespace Drupal\jurenites_dream_desires\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Site\Settings;
use Drupal\Core\Url;
use Drupal\jurenites_dream_desires\Entity\DreamDesire;
use Drupal\jurenites_dream_desires\Entity\DreamDevice;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpKernel\Exception\HttpException;

/** Explicit private API; no personal fields are added to the public card feed. */
final class DesireApiController extends ControllerBase {
  private function apiResponse(Request $request_object, callable $request_action): Response {
    try {
      if (!$request_object->isSecure() && !Settings::get('dream_desires_allow_http', FALSE)) {
        throw new HttpException(400, 'https_required');
      }
      $api_response = $request_action();
    }
    catch (HttpException $caught_error) {
      $api_response = new JsonResponse(['error' => $caught_error->getMessage()], $caught_error->getStatusCode());
    }
    catch (\Throwable $caught_error) {
      // Never expose database errors, prompts, file paths or provider credentials.
      $api_response = new JsonResponse(['error' => 'internal_error'], 500);
      \Drupal::logger('jurenites_dream_desires')->error('Private desire API failed (@type).', ['@type' => get_class($caught_error)]);
    }
    $api_response->headers->set('Cache-Control', 'private, no-store, max-age=0');
    $api_response->headers->set('X-Content-Type-Options', 'nosniff');
    $api_response->headers->set('Vary', 'Authorization, Cookie');
    if ($api_response->getStatusCode() === 202) {
      $api_response->headers->set('Retry-After', '5');
    }
    if ($api_response->getStatusCode() === 401) {
      $api_response->headers->set('WWW-Authenticate', 'Bearer');
    }
    return $api_response;
  }

  private function requestData(Request $request_object, int $byte_limit = 8192): array {
    if (strtolower(trim(explode(';', $request_object->headers->get('Content-Type', ''))[0])) !== 'application/json') {
      throw new HttpException(415, 'json_required');
    }
    if (strlen($request_object->getContent()) > $byte_limit) {
      throw new HttpException(413, 'request_too_large');
    }
    try {
      $request_data = json_decode($request_object->getContent(), TRUE, 8, JSON_THROW_ON_ERROR);
    }
    catch (\JsonException $caught_error) {
      throw new HttpException(400, 'invalid_json');
    }
    if (!is_array($request_data) || array_is_list($request_data)) {
      throw new HttpException(400, 'json_object_required');
    }
    return $request_data;
  }

  private function deviceToken(Request $request_object): string {
    if (!preg_match('/^Bearer ([a-f0-9]{64})$/D', $request_object->headers->get('Authorization', ''), $token_matches)) {
      throw new HttpException(401, 'device_token_required');
    }
    return $token_matches[1];
  }

  private function owningDevice(Request $request_object): DreamDevice {
    $device_entity = \Drupal::service('jurenites_dream_desires.workflow')->findDevice($this->deviceToken($request_object));
    if (!$device_entity) {
      throw new HttpException(401, 'invalid_device_token');
    }
    return $device_entity;
  }

  private function ownedDesire(Request $request_object, string $desire_uuid, bool $allow_editor = FALSE): DreamDesire {
    $admin_access = $allow_editor && $this->currentUser()->hasPermission('administer dream desires');
    $device_entity = $admin_access ? NULL : $this->owningDevice($request_object);
    $desire_items = $this->entityTypeManager()->getStorage('dream_desire')->loadByProperties(['uuid' => $desire_uuid]);
    $desire_entity = $desire_items ? reset($desire_items) : NULL;
    if (!$desire_entity || (!$admin_access && (int) $desire_entity->get('device_id')->target_id !== (int) $device_entity->id())) {
      throw new HttpException(404, 'desire_not_found');
    }
    return $desire_entity;
  }

  private function desireData(DreamDesire $desire_entity): array {
    $status_name = $desire_entity->get('status')->value;
    return [
      'id' => $desire_entity->uuid(), 'topic' => $desire_entity->get('topic_key')->value,
      'desire' => $desire_entity->get('desire_text')->value, 'status' => $status_name,
      'image_url' => $status_name === 'ready' ? Url::fromRoute('jurenites_dream_desires.image', ['desire_uuid' => $desire_entity->uuid()])->toString() : NULL,
      'image_revision' => $status_name === 'ready' ? $desire_entity->get('image_file')->entity?->uuid() : NULL,
      'error' => $desire_entity->get('error_code')->value,
    ];
  }

  public function registerDevice(Request $request): Response {
    return $this->apiResponse($request, function () use ($request) {
      $request_data = $this->requestData($request);
      if (!is_string($request_data['invite_code'] ?? NULL)) {
        throw new HttpException(400, 'invite_required');
      }
      $device_entity = \Drupal::service('jurenites_dream_desires.workflow')->registerDevice($this->deviceToken($request), $request_data['invite_code'], $request->getClientIp() ?? 'unknown');
      return new JsonResponse(['device_id' => $device_entity->uuid()]);
    });
  }

  /** Deletes every desire for this token before revoking it; safe to retry. */
  public function deleteDevice(Request $request): Response {
    return $this->apiResponse($request, function () use ($request) {
      $token_hash = hash('sha256', $this->deviceToken($request));
      $lock_backend = \Drupal::lock();
      if (!$lock_backend->acquire('dream_desires.write', 30)) {
        throw new HttpException(409, 'request_in_progress');
      }
      $held_locks = [];
      try {
        $device_storage = $this->entityTypeManager()->getStorage('dream_device');
        $device_items = $device_storage->loadByProperties(['token_hash' => $token_hash]);
        if (!$device_items) {
          return new Response('', 204);
        }
        $device_entity = reset($device_items);
        $desire_storage = $this->entityTypeManager()->getStorage('dream_desire');
        $desire_items = $desire_storage->loadByProperties(['device_id' => $device_entity->id()]);
        foreach ($desire_items as $desire_entity) {
          $lock_name = 'dream_desires.image.' . $desire_entity->id();
          if (!$lock_backend->acquire($lock_name, 30)) {
            throw new HttpException(409, 'generation_in_progress');
          }
          $held_locks[] = $lock_name;
        }
        $desire_storage->delete($desire_items);
        // Retain only the revoked credential hash, to prevent token reuse.
        $device_entity->set('active', FALSE)->save();
        return new Response('', 204);
      }
      finally {
        foreach ($held_locks as $lock_name) {
          $lock_backend->release($lock_name);
        }
        $lock_backend->release('dream_desires.write');
      }
    });
  }

  public function createDesire(Request $request): Response {
    return $this->apiResponse($request, function () use ($request) {
      $device_entity = $this->owningDevice($request);
      $desire_entity = \Drupal::service('jurenites_dream_desires.workflow')->createDesire($device_entity, $this->requestData($request, 1500000));
      $status_code = in_array($desire_entity->get('status')->value, ['queued', 'generating'], TRUE) ? 202 : 200;
      return new JsonResponse($this->desireData($desire_entity), $status_code);
    });
  }

  public function readDesire(Request $request, string $desire_uuid): Response {
    return $this->apiResponse($request, fn() => new JsonResponse($this->desireData($this->ownedDesire($request, $desire_uuid))));
  }

  public function readImage(Request $request, string $desire_uuid): Response {
    return $this->apiResponse($request, function () use ($request, $desire_uuid) {
      $desire_entity = $this->ownedDesire($request, $desire_uuid, TRUE);
      $image_file = $desire_entity->get('image_file')->entity;
      if ($desire_entity->get('status')->value !== 'ready' || !$image_file || !str_starts_with($image_file->getFileUri(), 'private://dream-desires/')) {
        throw new HttpException(404, 'image_not_ready');
      }
      $file_path = \Drupal::service('file_system')->realpath($image_file->getFileUri());
      if (!$file_path || !is_file($file_path)) {
        throw new HttpException(404, 'image_not_found');
      }
      return new BinaryFileResponse($file_path, 200, ['Content-Type' => 'image/jpeg', 'Content-Disposition' => 'inline; filename="dream.jpg"'], FALSE);
    });
  }

  public function deleteDesire(Request $request, string $desire_uuid): Response {
    return $this->apiResponse($request, function () use ($request, $desire_uuid) {
      $desire_entity = $this->ownedDesire($request, $desire_uuid);
      $lock_name = 'dream_desires.image.' . $desire_entity->id();
      if (!\Drupal::lock()->acquire($lock_name, 30)) {
        throw new HttpException(409, 'generation_in_progress');
      }
      try {
        $desire_entity->delete();
      }
      finally {
        \Drupal::lock()->release($lock_name);
      }
      return new Response('', 204);
    });
  }
}
