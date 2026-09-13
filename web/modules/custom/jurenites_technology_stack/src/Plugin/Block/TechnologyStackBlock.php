<?php

namespace Drupal\jurenites_technology_stack\Plugin\Block;

use Drupal\Core\Block\Attribute\Block;
use Drupal\Core\Block\BlockBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\StringTranslation\TranslatableMarkup;

/**
 * Presents the selected technologies in their core knowledge hierarchy.
 */
#[Block(
  id: 'jurenites_technology_stack',
  admin_label: new TranslatableMarkup('Technology stack'),
)]
final class TechnologyStackBlock extends BlockBase {

  /**
   * Reads the shared Drupal/Storybook catalogue.
   */
  private function technologyCategories(): array {
    return json_decode(file_get_contents(dirname(__DIR__, 3) . '/data/technologies.json'), TRUE, 512, JSON_THROW_ON_ERROR);
  }

  /**
   * {@inheritdoc}
   */
  public function defaultConfiguration(): array {
    return ['technology_selection' => NULL] + parent::defaultConfiguration();
  }

  /**
   * {@inheritdoc}
   */
  public function blockForm($form, FormStateInterface $form_state): array {
    $form = parent::blockForm($form, $form_state);
    $technology_options = [];
    foreach ($this->technologyCategories() as $category_data) {
      foreach ($category_data['technology_groups'] as $group_data) {
        foreach ($group_data['technology_items'] as $technology_data) {
          $technology_options[$technology_data['technology_key']] = $technology_data['technology_name'];
        }
      }
    }
    $form['technology_selection'] = [
      '#type' => 'checkboxes', '#title' => $this->t('Visible technologies'),
      '#options' => $technology_options,
      '#default_value' => $this->configuration['technology_selection'] ?? array_keys($technology_options),
      '#description' => $this->t('The block title is the section heading. Technologies retain their Code, Databases and Visuals grouping.'),
    ];
    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function blockSubmit($form, FormStateInterface $form_state): void {
    $this->configuration['technology_selection'] = array_values(array_filter($form_state->getValue('technology_selection')));
  }

  /**
   * {@inheritdoc}
   */
  public function build(): array {
    $technology_categories = [];
    foreach ($this->technologyCategories() as $category_data) {
      $visible_groups = [];
      foreach ($category_data['technology_groups'] as $group_data) {
        $group_data['technology_items'] = array_values(array_filter($group_data['technology_items'],
          fn(array $technology_data): bool => $this->configuration['technology_selection'] === NULL
            || in_array($technology_data['technology_key'], $this->configuration['technology_selection'], TRUE)));
        if ($group_data['technology_items']) {
          if ($group_data['group_name'] !== '') {
            $group_data['group_name'] = $this->t($group_data['group_name']);
          }
          $visible_groups[] = $group_data;
        }
      }
      if ($visible_groups) {
        $category_data['category_name'] = $this->t($category_data['category_name']);
        $category_data['technology_groups'] = $visible_groups;
        $technology_categories[] = $category_data;
      }
    }
    return [
      '#theme' => 'jurenites_technology_stack',
      '#section_heading' => $this->configuration['label'],
      '#technology_categories' => $technology_categories,
      '#asset_directory' => base_path() . 'themes/custom/jurenites_theme/assets/images/technology-stack/',
    ];
  }

}
