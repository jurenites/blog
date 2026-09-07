<?php

/**
 * @file
 * Post-update functions for Jurenites Contact.
 */

use Drupal\Core\StringTranslation\TranslatableMarkup;

/**
 * Adds an editable complete photograph below the Contact form.
 */
function jurenites_contact_post_update_add_desk_photograph(): void {
  jurenites_contact_photo_setup();
}

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

/**
 * Adds guidance placeholders to the public contact fields.
 */
function jurenites_contact_post_update_add_contact_placeholders(): TranslatableMarkup {
  $contact_webform = \Drupal::entityTypeManager()
    ->getStorage('webform')
    ->load('contact');

  if (!$contact_webform) {
    return t('The Contact Webform was not found; no placeholders were added.');
  }

  $contact_elements = $contact_webform->getElementsDecoded();
  $contact_placeholders = [
    'message_subject' => 'Enter the subject',
    'sender_name' => 'Enter your name',
    'message_body' => 'Enter your message',
  ];

  foreach ($contact_placeholders as $element_name => $placeholder_text) {
    if (isset($contact_elements[$element_name])) {
      $contact_elements[$element_name]['#placeholder'] = $placeholder_text;
    }
  }

  $contact_webform->setElements($contact_elements);
  $contact_webform->save();

  return t('Added placeholders to the Contact Webform fields.');
}

/**
 * Stops recreating the previous-submissions reminder on each Contact visit.
 */
function jurenites_contact_post_update_disable_previous_submission_notice(): TranslatableMarkup {
  $contact_webform = \Drupal::entityTypeManager()->getStorage('webform')->load('contact');
  if (!$contact_webform) {
    return t('The Contact Webform was not found; no reminder setting was changed.');
  }
  $contact_webform->setSetting('form_previous_submissions', FALSE);
  $contact_webform->save();
  return t('Disabled the repeated previous-submissions reminder on Contact.');
}
