<?php

/**
 * @file
 * Copy these settings into the environment-owned settings.php, after secrets
 * have been supplied by the host. Do not put actual secrets in Git or the APK.
 */

$settings['dream_desires_openai_api_key'] = getenv('OPENAI_API_KEY') ?: '';
$settings['dream_desires_invite_code'] = getenv('DREAM_DESIRES_INVITE_CODE') ?: '';
// Absolute, writable path OUTSIDE the Drupal web root. Create before enabling.
$private_directory = getenv('DRUPAL_PRIVATE_PATH');
if ($private_directory) {
  $settings['file_private_path'] = $private_directory;
}
// Production must use HTTPS. Set this only in isolated local development.
$settings['dream_desires_allow_http'] = FALSE;
