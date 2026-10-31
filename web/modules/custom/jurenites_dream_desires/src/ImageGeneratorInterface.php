<?php

namespace Drupal\jurenites_dream_desires;

interface ImageGeneratorInterface {
  /** Returns validated JPEG bytes for exactly one image; never retries a call. */
  public function generateImage(string $prompt_text, string $device_hash, array $model_options): string;
}
