<?php

/**
 * @file
 * Updates public URL behavior on existing sites.
 */

/**
 * Enables permanent redirects to clean, language-aware public URLs.
 */
function jurenites_path_aliases_post_update_enable_clean_url_redirects(): string {
  \Drupal::service('module_installer')->install(['redirect']);
  \Drupal::moduleHandler()->loadInclude('jurenites_path_aliases', 'install');
  jurenites_path_aliases_configure_redirects();

  return t('Enabled permanent redirects to clean public URLs and automatic redirects when aliases change.');
}
