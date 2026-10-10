<?php

namespace Drupal\jurenites_smep_periodic\Plugin\Block;

use Drupal\Core\Block\Attribute\Block;
use Drupal\Core\Block\BlockBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Drupal\Core\Extension\ModuleExtensionList;
use Drupal\Core\StringTranslation\TranslatableMarkup;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Embeds a self-contained periodic table without sharing application CSS.
 */
#[Block(
  id: 'jurenites_smep_periodic_table',
  admin_label: new TranslatableMarkup('SMEP periodic table'),
  category: new TranslatableMarkup('SMEP'),
)]
final class SmepPeriodicTableBlock extends BlockBase implements ContainerFactoryPluginInterface {

  public function __construct(array $configuration, $plugin_id, $plugin_definition, private readonly ModuleExtensionList $module_list) {
    parent::__construct($configuration, $plugin_id, $plugin_definition);
  }

  public static function create(ContainerInterface $service_container, array $configuration, $plugin_id, $plugin_definition): static {
    return new static($configuration, $plugin_id, $plugin_definition, $service_container->get('extension.list.module'));
  }

  public function defaultConfiguration(): array {
    return ['initial_mode' => 'small'] + parent::defaultConfiguration();
  }

  public function blockForm($form, FormStateInterface $form_state): array {
    $form = parent::blockForm($form, $form_state);
    $form['initial_mode'] = [
      '#type' => 'select',
      '#title' => $this->t('Initial card size'),
      '#options' => [
        'small' => $this->t('Small cards (31px)'),
        'normal' => $this->t('Normal cards (84 × 108px)'),
        'micro' => $this->t('Micro cells (4px)'),
      ],
      '#default_value' => $this->configuration['initial_mode'],
      '#description' => $this->t('Small cards fit the full table into most page columns. Normal cards can be scrolled horizontally.'),
    ];
    return $form;
  }

  public function blockSubmit($form, FormStateInterface $form_state): void {
    $initial_mode = $form_state->getValue('initial_mode');
    $this->configuration['initial_mode'] = in_array($initial_mode, ['normal', 'small', 'micro'], TRUE) ? $initial_mode : 'small';
  }

  public function build(): array {
    $module_path = $this->module_list->getPath('jurenites_smep_periodic');
    $manifest_path = DRUPAL_ROOT . '/' . $module_path . '/ui/build.json';
    $bundle_metadata = is_file($manifest_path) ? json_decode(file_get_contents($manifest_path), TRUE) : [];
    $bundle_version = rawurlencode($bundle_metadata['build'] ?? '1');
    $initial_mode = $this->configuration['initial_mode'];
    if (!in_array($initial_mode, ['normal', 'small', 'micro'], TRUE)) {
      $initial_mode = 'small';
    }
    return [
      '#theme' => 'jurenites_smep_periodic_block',
      '#application_url' => base_path() . $module_path . '/ui/index.html?mode=' . $initial_mode . '&v=' . $bundle_version,
      '#frame_title' => $this->t('SMEP interactive periodic table'),
      '#attached' => ['library' => ['jurenites_smep_periodic/embed']],
      '#cache' => ['contexts' => ['languages:language_interface', 'url.site']],
    ];
  }

}
