<?php

/**
 * @file
 * Updates editable template copy without replacing editorial changes.
 */

/**
 * Adds content-owned headings and standalone Page copy blocks.
 */
function jurenites_editorial_post_update_template_copy(): string {
  \Drupal::moduleHandler()->loadInclude('jurenites_editorial', 'install');
  jurenites_editorial_migrate_template_copy();
  return (string) t('Template copy is now editable on its content or in Page copy blocks.');
}
