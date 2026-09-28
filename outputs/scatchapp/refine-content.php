<?php
$project_node = \Drupal\node\Entity\Node::load(106);
if ($project_node->uuid() !== '837ef164-a7e0-482b-88b5-a9a720a0d777') throw new RuntimeException('Unexpected project.');
$project_data = json_decode(file_get_contents(DRUPAL_ROOT . '/../scripts/content/scatchapp.json'), TRUE);
foreach ($project_node->get('field_content_sections') as $section_index => $section_item) {
  $story_paragraph = $section_item->entity;
  $story_paragraph->setNewRevision(TRUE);
  $story_paragraph->set('field_project_story_body', ['value' => $project_data['story_sections'][$section_index]['story_html'], 'format' => 'full_html']);
  $story_paragraph->save();
  $section_item->target_revision_id = $story_paragraph->getRevisionId();
}
$project_node->setNewRevision(TRUE);
$project_node->setRevisionLogMessage('Add video stills and clarify recording descriptions.');
$project_node->save();
$preview_blocks = \Drupal::entityTypeManager()->getStorage('block_content')->loadByProperties(['uuid' => 'd70557b9-7e26-436a-9201-459375bd81f2']);
$preview_block = reset($preview_blocks);
$preview_markup = file_get_contents(DRUPAL_ROOT . '/../generated/content/scatchapp-preview.html');
$preview_block->setNewRevision(TRUE);
$preview_block->set('body', ['format' => 'full_html', 'value' => '<section class="project-case-preview"><div class="project-case-preview__copy"><h2>ScatchApp</h2><p>' . $project_data['project_summary'] . '</p><p><a href="/portfolio/scatchapp">Read the project note</a></p></div>' . $preview_markup . '</section>']);
$preview_block->save();
echo 'Refined newly created ScatchApp content.' . PHP_EOL;
