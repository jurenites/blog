<?php
$project_node = \Drupal\node\Entity\Node::load(27);
$current_file = $project_node->field_dynamic_thumbnail->entity;
if (hash_file('sha256', $current_file->getFileUri()) !== '39d8895d581b9766a1f488ff672760f04df34c6ee389e7cb8199c54466513081') throw new \RuntimeException('Thumbnail changed since inspection.');
$svg_source = file_get_contents(DRUPAL_ROOT . '/../src/public/assets/images/dynamic-thumbnails/oksenate.svg');
if (\Drupal\jurenites_dynamic_thumbnail\ThumbnailSvg::prepare($svg_source, 'verify') === NULL) throw new \RuntimeException('Invalid replacement.');
$replacement_file = \Drupal::service('file.repository')->writeData($svg_source, 'public://dynamic-thumbnails/oksenate.svg', \Drupal\Core\File\FileExists::Rename);
$replacement_file->setPermanent();
$replacement_file->save();
$project_node->setNewRevision(TRUE);
$project_node->setRevisionLogMessage('Remove synthetic background highlight from Oksenate SVG; preserve photo parallax.');
$project_node->set('field_dynamic_thumbnail', ['target_id' => $replacement_file->id()]);
$project_node->save();
echo 'Saved Oksenate revision using file ' . $replacement_file->id() . PHP_EOL;
