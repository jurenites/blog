<?php

namespace Drupal\jurenites_metrika\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Configures the site's counter without allowing arbitrary script injection.
 */
final class MetrikaSettingsForm extends ConfigFormBase {

  /**
   * {@inheritdoc}
   */
  public function getFormId(): string {
    return 'jurenites_metrika_settings';
  }

  /**
   * {@inheritdoc}
   */
  protected function getEditableConfigNames(): array {
    return ['jurenites_metrika.settings'];
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state): array {
    // Drupal's routed form argument resolver requires the exact name $form.
    $form_elements = $form;
    $tracking_config = $this->config('jurenites_metrika.settings');
    $form_elements['tracking_enabled'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Enable tracking'),
      '#default_value' => $tracking_config->get('tracking_enabled'),
      '#description' => $this->t('Tracks anonymous public visits on jurenites.com and www.jurenites.com only. Local development, signed-in users, administration, account, and content editing pages are excluded.'),
    ];
    $form_elements['counter_id'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Counter ID'),
      '#default_value' => $tracking_config->get('counter_id'),
      '#description' => $this->t('Uses Webvisor session replay, click maps, accurate bounce tracking, link tracking, and the dataLayer ecommerce container. Leave empty to stop tracking.'),
      '#maxlength' => 15,
    ];
    return parent::buildForm($form_elements, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public function validateForm(array &$form_elements, FormStateInterface $form_state): void {
    parent::validateForm($form_elements, $form_state);
    $counter_id = trim((string) $form_state->getValue('counter_id'));
    $form_state->setValue('counter_id', $counter_id);
    if ($counter_id !== '' && !preg_match('/^[1-9][0-9]{0,14}$/D', $counter_id)) {
      $form_state->setErrorByName('counter_id', $this->t('Enter a positive numeric counter ID, up to 15 digits.'));
    }
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form_elements, FormStateInterface $form_state): void {
    $this->config('jurenites_metrika.settings')
      ->set('tracking_enabled', (bool) $form_state->getValue('tracking_enabled'))
      ->set('counter_id', $form_state->getValue('counter_id'))
      ->save();
    parent::submitForm($form_elements, $form_state);
  }

}
