<?php
$inventory_rows = [];
foreach (['node', 'block_content', 'menu_link_content', 'taxonomy_term', 'paragraph'] as $entity_type) {
  $entity_storage = \Drupal::entityTypeManager()->getStorage($entity_type);
  foreach ($entity_storage->loadMultiple() as $content_entity) {
    if ($content_entity->language()->getId() !== 'en') { continue; }
    if ($entity_type === 'node' && !$content_entity->isPublished()) { continue; }
    $field_rows = [];
    foreach ($content_entity->getFields() as $field_name => $field_items) {
      $field_type = $field_items->getFieldDefinition()->getType();
      if (!in_array($field_type, ['string', 'string_long', 'text', 'text_long', 'text_with_summary', 'link', 'image'])) { continue; }
      if (in_array($field_name, ['uuid', 'revision_log', 'revision_log_message', 'menu_name'])) { continue; }
      foreach ($field_items as $item_index => $field_item) {
        foreach ($field_item->getValue() as $property_name => $property_value) {
          if (!in_array($property_name, ['value', 'summary', 'title', 'alt']) || !is_string($property_value) || trim($property_value) === '') { continue; }
          $field_rows[] = ['field' => $field_name, 'delta' => $item_index, 'property' => $property_name, 'en' => $property_value, 'translatable' => $field_items->getFieldDefinition()->isTranslatable()];
        }
      }
    }
    $inventory_rows[] = ['type' => $entity_type, 'uuid' => $content_entity->uuid(), 'id' => $content_entity->id(), 'bundle' => $content_entity->bundle(), 'has_ru' => $content_entity->hasTranslation('ru'), 'fields' => $field_rows];
  }
}
file_put_contents('/opt/drupal/translations/inventory.json', json_encode($inventory_rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
echo count($inventory_rows) . " entities\n";
