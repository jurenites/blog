<?php

/**
 * @file
 * Post-update functions for Jurenites Contact.
 */

use Drupal\Core\StringTranslation\TranslatableMarkup;

/**
 * Adds a server-validated maximum length to the public contact message.
 */
function jurenites_contact_post_update_bound_message_length(): TranslatableMarkup {
  $contact_webform = \Drupal::entityTypeManager()
    ->getStorage('webform')
    ->load('contact');

  if (!$contact_webform) {
    return t('The Contact Webform was not found; no message length limit was changed.');
  }

  $contact_elements = $contact_webform->getElementsDecoded();
  if (!isset($contact_elements['message_body'])) {
    return t('The Contact message element was not found; no message length limit was changed.');
  }

  $contact_elements['message_body']['#maxlength'] = 5000;
  $contact_webform->setElements($contact_elements);
  $contact_webform->save();

  return t('Limited Contact messages to 5000 characters.');
}

/**
 * Replaces the visible math CAPTCHA with background Antibot protection.
 */
function jurenites_contact_post_update_replace_math_captcha_with_antibot(): TranslatableMarkup {
  \Drupal::service('module_installer')->install(['antibot']);
  jurenites_contact_enable_antibot_protection();

  return t('Protected the Contact form with Antibot and removed its math CAPTCHA.');
}
