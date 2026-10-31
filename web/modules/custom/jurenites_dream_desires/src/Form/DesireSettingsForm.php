<?php

namespace Drupal\jurenites_dream_desires\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\jurenites_dream_desires\OpenAiImageGenerator;

final class DesireSettingsForm extends ConfigFormBase {
  public function getFormId() { return 'jurenites_dream_desires_settings'; }
  protected function getEditableConfigNames() { return ['jurenites_dream_desires.settings']; }

  public function buildForm(array $form, FormStateInterface $form_state) {
    $settings_config = $this->config('jurenites_dream_desires.settings');
    $form['provider_status'] = ['#type' => 'item', '#title' => $this->t('Ключ OpenAI'), '#plain_text' => OpenAiImageGenerator::apiKey() !== '' ? $this->t('Настроен на сервере') : $this->t('Не настроен. Добавьте OPENAI_API_KEY в окружение сервера.')];
    $form['enabled'] = ['#type' => 'checkbox', '#title' => $this->t('Принимать новые запросы генерации'), '#default_value' => $settings_config->get('enabled')];
    $form['model'] = ['#type' => 'textfield', '#title' => $this->t('Модель OpenAI'), '#required' => TRUE, '#maxlength' => 100, '#default_value' => $settings_config->get('model')];
    $form['quality'] = ['#type' => 'select', '#title' => $this->t('Качество'), '#options' => ['low' => $this->t('Низкое'), 'medium' => $this->t('Среднее'), 'high' => $this->t('Высокое')], '#default_value' => $settings_config->get('quality')];
    $form['size'] = ['#type' => 'select', '#title' => $this->t('Формат'), '#options' => ['1024x1536' => $this->t('Вертикальный'), '1536x1024' => $this->t('Горизонтальный'), '1024x1024' => $this->t('Квадратный')], '#default_value' => $settings_config->get('size')];
    foreach (['device_daily_limit' => $this->t('Новых изображений на устройство за 24 часа'), 'site_daily_limit' => $this->t('Новых изображений всего за 24 часа')] as $field_key => $field_label) {
      $form[$field_key] = ['#type' => 'number', '#title' => $field_label, '#min' => 1, '#max' => 1000, '#required' => TRUE, '#default_value' => $settings_config->get($field_key)];
    }
    return parent::buildForm($form, $form_state);
  }

  public function validateForm(array &$form, FormStateInterface $form_state) {
    parent::validateForm($form, $form_state);
    if (!preg_match('/^gpt-image-[a-z0-9.\-]+$/D', (string) $form_state->getValue('model'))) {
      $form_state->setErrorByName('model', $this->t('Укажите модель семейства gpt-image.'));
    }
  }

  public function submitForm(array &$form, FormStateInterface $form_state) {
    $settings_config = $this->config('jurenites_dream_desires.settings');
    foreach (['enabled', 'model', 'quality', 'size', 'device_daily_limit', 'site_daily_limit'] as $config_key) {
      $config_value = $form_state->getValue($config_key);
      $settings_config->set($config_key, str_ends_with($config_key, '_limit') ? (int) $config_value : ($config_key === 'enabled' ? (bool) $config_value : $config_value));
    }
    $settings_config->save();
    parent::submitForm($form, $form_state);
  }
}
