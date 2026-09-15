<?php

/** Adds the SMEP screen gallery once; preserves existing article sections. */
use Drupal\Core\File\FileExists;
use Drupal\Core\File\FileSystemInterface;
use Drupal\paragraphs\Entity\Paragraph;

$project_nodes = \Drupal::entityTypeManager()->getStorage('node')->loadByProperties(['uuid' => '9dcf5017-82ef-477c-8d99-dcaa26896516']);
$project_node = reset($project_nodes);
if (!$project_node) {
  throw new RuntimeException('Create the SMEP project first.');
}
foreach ($project_node->field_content_sections as $section_item) {
  if ($section_item->entity->bundle() === 'screen_slider') {
    echo "SMEP slider already exists; editorial changes preserved.\n";
    return;
  }
}
$source_files = glob(dirname(__DIR__) . '/src/public/assets/images/projects/smep/screens/*.png');
natsort($source_files);
if (!$source_files) {
  throw new RuntimeException('SMEP screen exports are missing.');
}
$destination_directory = 'public://projects/smep/screens';
\Drupal::service('file_system')->prepareDirectory($destination_directory, FileSystemInterface::CREATE_DIRECTORY | FileSystemInterface::MODIFY_PERMISSIONS);
$image_references = [];
foreach ($source_files as $source_path) {
  $file_name = basename($source_path);
  $image_file = \Drupal::service('file.repository')->writeData(file_get_contents($source_path), $destination_directory . '/' . $file_name, FileExists::Replace);
  $image_size = getimagesize($source_path);
  $image_references[] = ['target_id' => $image_file->id(), 'alt' => 'SMEP interface — ' . pathinfo($file_name, PATHINFO_FILENAME), 'width' => $image_size[0], 'height' => $image_size[1]];
}
$slider_paragraph = Paragraph::create(['type' => 'screen_slider', 'field_screen_images' => $image_references]);
$slider_paragraph->save();
$section_references = $project_node->field_content_sections->getValue();
array_unshift($section_references, ['target_id' => $slider_paragraph->id(), 'target_revision_id' => $slider_paragraph->getRevisionId()]);
$project_node->setNewRevision(TRUE);
$project_node->setRevisionLogMessage('Add editable SMEP screen slider in filename order.');
$project_node->set('field_content_sections', $section_references)->save();
echo 'Added ' . count($image_references) . " screens to SMEP.\n";
