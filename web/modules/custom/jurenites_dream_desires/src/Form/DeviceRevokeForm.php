<?php

namespace Drupal\jurenites_dream_desires\Form;

use Drupal\Core\Form\ConfirmFormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Url;
use Drupal\jurenites_dream_desires\Entity\DreamDevice;

final class DeviceRevokeForm extends ConfirmFormBase {
  private DreamDevice $device_entity;
  public function getFormId() { return 'dream_device_revoke'; }
  public function getQuestion() { return $this->t('Отключить доступ этого устройства?'); }
  public function getDescription() { return $this->t('Устройство больше не сможет создавать мечты и получать личные изображения.'); }
  public function getCancelUrl() { return Url::fromRoute('jurenites_dream_desires.admin'); }
  public function buildForm(array $form, FormStateInterface $form_state, ?DreamDevice $dream_device = NULL) {
    $this->device_entity = $dream_device;
    return parent::buildForm($form, $form_state);
  }
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $this->device_entity->set('active', FALSE)->save();
    $this->messenger()->addStatus($this->t('Доступ устройства отключён.'));
    $form_state->setRedirect('jurenites_dream_desires.admin');
  }
}
