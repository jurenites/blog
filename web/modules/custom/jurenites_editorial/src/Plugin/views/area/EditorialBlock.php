<?php

namespace Drupal\jurenites_editorial\Plugin\views\area;

use Drupal\Core\Cache\CacheableMetadata;
use Drupal\Core\Form\FormStateInterface;
use Drupal\views\Attribute\ViewsArea;
use Drupal\views\Plugin\views\area\Entity;

/**
 * Renders a Content Block with the normal block wrapper and contextual links.
 */
#[ViewsArea('editorial_block')]
class EditorialBlock extends Entity {

  /**
   * Keeps unsupported token replacement and access bypass out of the form.
   */
  public function buildOptionsForm(&$area_form, FormStateInterface $form_state) {
    parent::buildOptionsForm($area_form, $form_state);
    $area_form['bypass_access']['#access'] = FALSE;
    $area_form['tokenize']['#access'] = FALSE;
  }

  /**
   * {@inheritdoc}
   */
  public function render($is_empty = FALSE) {
    if ($is_empty && empty($this->options['empty'])) {
      return [];
    }

    // UUID references survive database changes; this area never bypasses access.
    $block_entity = $this->entityRepository->loadEntityByConfigTarget('block_content', $this->options['target']);
    $cache_metadata = (new CacheableMetadata())
      ->addCacheTags(['block_content_list'])
      ->addCacheContexts(['languages:language_content']);
    $block_build = [];
    if ($block_entity !== NULL) {
      $block_entity = $this->entityRepository->getTranslationFromContext($block_entity);
      $access_result = $block_entity->access('view', NULL, TRUE);
      $cache_metadata->addCacheableDependency($block_entity)->addCacheableDependency($access_result);
      if ($access_result->isAllowed()) {
        $block_build = [
          '#theme' => 'block',
          '#attributes' => ['class' => ['editorial-copy']],
          '#configuration' => ['label' => $block_entity->label(), 'label_display' => FALSE, 'provider' => 'jurenites_editorial'],
          '#plugin_id' => 'block_content:' . $block_entity->uuid(),
          '#base_plugin_id' => 'block_content',
          '#derivative_plugin_id' => $block_entity->uuid(),
          '#contextual_links' => [
            'block_content' => ['route_parameters' => ['block_content' => $block_entity->id()]],
          ],
          'content' => $this->entityTypeManager->getViewBuilder('block_content')->view($block_entity, $this->options['view_mode']),
        ];
      }
    }
    $cache_metadata->applyTo($block_build);
    return $block_build;
  }

}
